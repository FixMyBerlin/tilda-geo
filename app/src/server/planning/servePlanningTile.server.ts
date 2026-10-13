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

const TileParamsSchema = z.object({
  regionSlug: z.string().regex(/^[a-z0-9-]+$/),
  layer: z.enum(planningTileLayers),
  z: z.string().regex(/^\d{1,2}$/),
  x: z.string().regex(/^\d{1,8}$/),
  y: z.string().regex(/^\d{1,8}$/),
  runId: z.string().regex(/^\d{1,10}$/),
})

type TileArgs = { z: number; x: number; y: number; runId: string }

// One fixed statement per layer. The function name never comes from string interpolation.
// The functions live in the `planning` schema, which Martin does not publish.
const tileQueries: Record<PlanningTileLayer, (args: TileArgs) => Prisma.Sql> = {
  hexagons: ({ z, x, y, runId }) =>
    Prisma.sql`SELECT planning.planning_hexagons(${z}::int, ${x}::int, ${y}::int, json_build_object('run_id', ${runId}::text)) AS mvt`,
  vegetation: ({ z, x, y, runId }) =>
    Prisma.sql`SELECT planning.planning_vegetation(${z}::int, ${x}::int, ${y}::int, json_build_object('run_id', ${runId}::text)) AS mvt`,
  carriageways: ({ z, x, y, runId }) =>
    Prisma.sql`SELECT planning.planning_carriageways(${z}::int, ${x}::int, ${y}::int, json_build_object('run_id', ${runId}::text)) AS mvt`,
  census: ({ z, x, y, runId }) =>
    Prisma.sql`SELECT planning.planning_census(${z}::int, ${x}::int, ${y}::int, json_build_object('run_id', ${runId}::text)) AS mvt`,
}

/**
 * One query for everything the check needs: the run exists, belongs to this region, the region has
 * Flächenfinder enabled, and the user is a member (admins skip that). Same variant → area → region
 * join as `getPlanningHexagonGeomFn`. MapLibre requests many tiles per pan, so this stays at one
 * round trip. Deactivated regions are not excluded, like in the planning server functions.
 */
async function canReadRun(
  session: { userId: string; role: string },
  regionSlug: string,
  runId: number,
) {
  const run = await db.planningRun.findFirst({
    where: {
      id: runId,
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
  return run !== null
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

  if (!(await canReadRun(session, regionSlug, Number(runId)))) {
    // Non-members get the same answer for every reason (not a member, flag off, run of another
    // region, unknown run or slug), so run ids and slugs cannot be probed.
    return session.role === UserRoleEnum.ADMIN ? notFoundJson() : forbiddenJson()
  }

  const rows = await geoDataClient.$queryRaw<{ mvt: Uint8Array | null }[]>(
    tileQueries[layer]({ z: Number(tile.z), x: Number(tile.x), y: Number(tile.y), runId }),
  )
  const mvt = rows[0]?.mvt
  if (!mvt || mvt.length === 0) return new Response(null, { status: 204 })

  return new Response(mvt as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'X-Content-Type-Options': 'nosniff',
      // `private`: member data, shared caches must not store it. The browser serves cached tiles
      // without our check, so this is also how long they stay readable after sign-out or after a
      // membership ends (same acceptance as private backgrounds). A run is immutable.
      'Cache-Control': 'private, max-age=604800',
    },
  })
}
