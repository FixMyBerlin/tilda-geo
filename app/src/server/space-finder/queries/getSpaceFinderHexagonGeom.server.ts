import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'

export const HexagonGeomInput = z.object({ runId: z.number().int(), h3Id: z.string() })

/**
 * Full outline of one result hexagon (lng/lat). The vector tiles clip each hexagon to its
 * tile (`ST_AsMVTGeom`), so a candidate picked at a tile border would otherwise be stored
 * as a fragment.
 */
export async function getSpaceFinderHexagonGeom(
  data: z.infer<typeof HexagonGeomInput>,
  headers: Headers,
) {
  const session = await requireAuth(headers)
  const run = await db.spaceFinderRun.findFirstOrThrow({
    where: { id: data.runId },
    select: { variant: { select: { area: { select: { region: { select: { slug: true } } } } } } },
  })
  await authorizeSpaceFinderRegion(session, run.variant.area.region.slug)

  const rows = await db.$queryRaw<{ geom: GeoJSON.Polygon }[]>`
    SELECT ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geom
    FROM space_finder.scenario_hexagons
    WHERE run_id = ${data.runId} AND h3_id = ${data.h3Id}
    LIMIT 1
  `
  const geom = rows[0]?.geom
  if (!geom) throw new Error(`Hexagon ${data.h3Id} nicht gefunden`)
  return geom
}
