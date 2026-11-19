import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { SPACE_FINDER_TOP_BY, SPACE_FINDER_TOP_MAX } from '@/shared/regionen/spaceFinderTop.const'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'

export const TopHexagonsInput = z.object({
  runId: z.number().int(),
  count: z.number().int().min(1).max(SPACE_FINDER_TOP_MAX),
  /** 0 = every area */
  minAreaM2: z.number().min(0),
  by: z.enum(SPACE_FINDER_TOP_BY),
})

export type SpaceFinderTopHexagon = {
  h3Id: string
  /** Coarse overview cell (res 11) the hexagon lies in, so the map can keep it lit when zoomed out. */
  coarseH3Id: string | null
  geometry: GeoJSON.Polygon
  properties: Record<string, string | number | boolean | null>
}

/**
 * The best fine hexagons (res 13) of a run, ranked by `mce_gesamtscore`, ties by the size of their
 * contiguous area. `by: 'area'` keeps only the best hexagon of each contiguous area, so the ranking
 * names X places instead of X neighbors in the same spot.
 *
 * The worker stores only the area size (`cluster_area_m2`), not which area a hexagon belongs to, so
 * the areas are rebuilt here: hexagons with a `cluster_area_m2` (score at least the run's
 * `min_score_threshold`) that touch form one area, like the H3 neighborhood in the worker's
 * `assign_clusters`.
 */
export async function getSpaceFinderTopHexagons(
  data: z.infer<typeof TopHexagonsInput>,
  headers: Headers,
) {
  const session = await requireAuth(headers)
  // Like the tiles: a PENDING run may be half written, and the client caches the ranking.
  const run = await db.spaceFinderRun.findFirstOrThrow({
    where: { id: data.runId, status: { in: ['COMPLETE', 'EMPTY'] } },
    select: { variant: { select: { area: { select: { region: { select: { slug: true } } } } } } },
  })
  await authorizeSpaceFinderRegion(session, run.variant.area.region.slug)

  const areaFilter =
    data.minAreaM2 > 0
      ? Prisma.sql`AND cluster_area_m2 >= ${data.minAreaM2}`
      : data.by === 'area'
        ? Prisma.sql`AND cluster_area_m2 IS NOT NULL`
        : Prisma.empty

  // `ST_ClusterDBSCAN` with a tiny eps: neighbor hexagons share their edges, so this is
  // "touches", robust against rounding in the 3857 coordinates.
  const ranked =
    data.by === 'area'
      ? Prisma.sql`
          SELECT DISTINCT ON (area_id) *
          FROM (
            SELECT *, ST_ClusterDBSCAN(geom, 0.01, 1) OVER () AS area_id
            FROM pool
          ) AS clustered
          ORDER BY area_id, mce_gesamtscore DESC, h3_id`
      : Prisma.sql`SELECT * FROM pool`

  const rows = await db.$queryRaw<
    {
      h3_id: string
      coarse_h3_id: string | null
      geometry: GeoJSON.Polygon
      properties: Record<string, string | number | boolean | null>
    }[]
  >`
    WITH pool AS (
      SELECT *
      FROM space_finder.scenario_hexagons
      WHERE run_id = ${data.runId}
        AND resolution = 13
        AND mce_gesamtscore IS NOT NULL
        AND eignungsklasse IS DISTINCT FROM 'ausgeschlossen'
        ${areaFilter}
    ),
    top AS (
      SELECT * FROM (${ranked}) AS ranked
      ORDER BY mce_gesamtscore DESC, cluster_area_m2 DESC NULLS LAST, h3_id
      LIMIT ${data.count}
    )
    SELECT
      top.h3_id,
      coarse.h3_id AS coarse_h3_id,
      ST_AsGeoJSON(ST_Transform(top.geom, 4326))::json AS geometry,
      to_jsonb(top) - 'geom' - 'run_id' - 'resolution' - 'area_id' AS properties
    FROM top
    LEFT JOIN LATERAL (
      SELECT h3_id
      FROM space_finder.scenario_hexagons
      WHERE run_id = ${data.runId}
        AND resolution = 11
        AND ST_Intersects(geom, ST_Centroid(top.geom))
      LIMIT 1
    ) AS coarse ON true
    ORDER BY top.mce_gesamtscore DESC, top.cluster_area_m2 DESC NULLS LAST, top.h3_id
  `

  return rows.map((row): SpaceFinderTopHexagon => ({
    h3Id: row.h3_id,
    coarseH3Id: row.coarse_h3_id,
    geometry: row.geometry,
    properties: row.properties,
  }))
}
