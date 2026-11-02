import { z } from 'zod'
import { Prisma, UserRoleEnum } from '@/prisma/generated/client'
import {
  badRequestJson,
  forbiddenJson,
  notFoundJson,
  unauthorizedJson,
} from '@/server/api/util/apiJsonResponses.server'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { planningTileLayers, type PlanningTileLayer } from '@/server/planning/planningTilesPath'
import { geoDataClient } from '@/server/prisma-client.server'

// Digits only (no `1e3`, no blanks), then the numeric range. `PlanningRun.id` is int4, and
// `ST_TileEnvelope` raises for z > 30 or x/y outside 0…2^z-1; both would otherwise end in a 500.
const digits = (maxLength: number) =>
  z
    .string()
    .regex(new RegExp(`^\\d{1,${maxLength}}$`))
    .transform(Number)
const TileParamsSchema = z
  .object({
    regionSlug: z.string().regex(/^[a-z0-9-]+$/),
    layer: z.enum(planningTileLayers),
    z: digits(2).pipe(z.number().max(30)),
    x: digits(10),
    y: digits(10),
    runId: digits(10).pipe(z.number().min(1).max(2147483647)),
  })
  .refine((tile) => tile.x < 2 ** tile.z && tile.y < 2 ** tile.z)

// The function name never comes from the request: it is looked up in this fixed map by the
// `layer` enum. The functions live in the `planning` schema, which Martin does not publish.
const tileFunctions: Record<PlanningTileLayer, string> = {
  hexagons: 'planning.planning_hexagons',
  vegetation: 'planning.planning_vegetation',
  carriageways: 'planning.planning_carriageways',
  census: 'planning.planning_census',
}

// `private`: member data, shared caches must not store it. The browser serves cached tiles
// without our check, so this is also how long they stay readable after sign-out or after a
// membership ends (same acceptance as private backgrounds). A finished run is immutable, so an
// empty tile is cached the same way as one with bytes. Census reads
// `data.census_population_point` directly (not per run), but that table practically never changes.

// MapLibre requests many tiles per pan, all for the same run. A positive check is reused for a
// short time so a pan costs one permission query, not one per tile. Denials are not cached.
// A membership that ends stays valid here for at most this long (the browser cache is longer).
const allowedTtlMs = 60_000
const allowedUntil = new Map<string, number>()

/**
 * One query for everything the check needs: the run exists, is finished, belongs to this region,
 * the region has Flächenfinder enabled, and the user is a member (admins skip that). Same variant →
 * area → region join as `getPlanningHexagonGeomFn`. Deactivated regions are not excluded, like in
 * the planning server functions. A run that is still PENDING is refused: its tables may be half
 * written and its tiles must not end up in the 7-day browser cache.
 */
async function canReadRun(
  session: { userId: string; role: string },
  regionSlug: string,
  runId: number,
) {
  const key = `${session.userId}:${regionSlug}:${runId}`
  const now = Date.now()
  if ((allowedUntil.get(key) ?? 0) > now) return true

  const run = await db.planningRun.findFirst({
    where: {
      id: runId,
      status: { in: ['COMPLETE', 'EMPTY'] },
      variant: {
        area: {
          region: {
            slug: regionSlug,
            spaceFinderEnabled: true,
            ...(session.role === UserRoleEnum.ADMIN
              ? {}
              : { memberships: { some: { userId: session.userId } } }),
          },
        },
      },
    },
    select: { id: true },
  })
  if (run === null) return false

  for (const [k, until] of allowedUntil) if (until <= now) allowedUntil.delete(k)
  allowedUntil.set(key, now + allowedTtlMs)
  return true
}

/** Test hook: forget all cached permission checks. */
export function clearPlanningTileAccessCache() {
  allowedUntil.clear()
}

/**
 * Serves one Flächenfinder vector tile. Hex scores and census population are member-only, so they
 * do not go through Martin's public hosts; the app checks the session and the run's region first.
 */
export async function servePlanningTile(request: Request, params: unknown) {
  const session = await getAppSession(request.headers)
  if (!session?.userId) return unauthorizedJson()

  const runIdParam = new URL(request.url).searchParams.get('run_id')
  const parsed = TileParamsSchema.safeParse({ ...(params as object), runId: runIdParam })
  if (!parsed.success) return badRequestJson()
  const { regionSlug, layer, runId, ...tile } = parsed.data

  if (!(await canReadRun(session, regionSlug, runId))) {
    // Non-members get the same answer for every reason (not a member, flag off, run of another
    // region, unknown or unfinished run or slug), so run ids and slugs cannot be probed.
    return session.role === UserRoleEnum.ADMIN ? notFoundJson() : forbiddenJson()
  }

  const rows = await geoDataClient.$queryRaw<{ mvt: Uint8Array | null }[]>(
    Prisma.sql`SELECT ${Prisma.raw(tileFunctions[layer])}(${tile.z}::int, ${tile.x}::int, ${tile.y}::int, json_build_object('run_id', ${String(runId)}::text)) AS mvt`,
  )
  const mvt = rows[0]?.mvt
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=604800',
  }
  if (!mvt || mvt.length === 0) return new Response(null, { status: 204, headers })

  return new Response(mvt as BodyInit, {
    headers: { ...headers, 'Content-Type': 'application/vnd.mapbox-vector-tile' },
  })
}
