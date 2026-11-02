import { Prisma } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { geoDataClient } from '@/server/prisma-client.server'

/**
 * Suggests `bewohnerbedarf_saettigung_ew` from the census data of the Planungsgebiet.
 *
 * The parameter is NOT a density but the saturation value of the weighted neighborhood sum per
 * hexagon: Σ residents × (1 − distance/20 m), measured from the building edge (see
 * `flaechenfinder/scorer.py`, steps 5 and 13). It cannot be derived reliably from a density in
 * residents/ha — measured on three real runs the ratio varies by a factor of 2.3, because gross
 * density depends on how much park, commercial and water lies in the drawn polygon. So we
 * estimate the same quantity directly: grid sample over the area, census points aggregated onto
 * the nearest OSM building within a tolerance, same ramp. Against the back-calculated
 * distributions of those runs, p50/p75/p90 matched within a few percent.
 *
 * We suggest p90: the top tenth of the inhabited area gets the full bonus, the rest is spread
 * over the full range. The value is a starting point — the UI shows it as auto-detected and
 * lets the user override it.
 */

/** Sample grid spacing. 40 m instead of the 20 m H3 grid: in a test on 15 km² of dense Berlin
 * p75 differed by 0.8 %, runtime dropped from 2.2 s to 0.9 s. */
const SAMPLE_GRID_M = Prisma.raw('40')

/** Reach of the factor from the building edge — must match `UseCaseConfig.bewohnerbedarf_radius_m`
 * in `flaechenfinder/config.py` (deliberately not configurable in the UI there). */
const DEMAND_RADIUS_M = Prisma.raw('20.0')

/** Census points go to the nearest OSM building within this distance (ALKIS and OSM outlines
 * rarely line up) — must match `CENSUS_BUILDING_TOLERANCE_M` in `flaechenfinder/config.py`. */
const CENSUS_BUILDING_TOLERANCE_M = Prisma.raw('5.0')

/** Metric CRS of the computation — same as in the worker. */
const METRIC_SRID = Prisma.raw('25832')

/** Source CRS of `data.census_population_point` and `public._buildings`. */
const SOURCE_SRID = Prisma.raw('5243')

/** Emergency brake: the area is capped at 25 km², but a request in the create dialog must
 * never hang. Otherwise Prisma aborts the transaction after its own 5 s, before the statement
 * timeout could even kick in. */
const STATEMENT_TIMEOUT_MS = Prisma.raw('30000')
const TRANSACTION_TIMEOUT_MS = 35_000

/** Bounds of the suggestion. The lower bound keeps a single house in a nearly uninhabited area
 * from triggering the full bonus; the upper bound keeps one high-rise from pushing the whole
 * area to "never full bonus". */
const MIN_SUGGESTION = 3
const MAX_SUGGESTION = 150

/** Round to integers below 10, above that to multiples of 5 (the input steps by 5). */
const roundSuggestion = (value: number) =>
  value < 10 ? Math.max(1, Math.round(value)) : Math.round(value / 5) * 5

type CensusStats = { saettigungEw: number; ewPerHa: number }

/**
 * Computes the stats for a study area geometry. Returns `null` if the data schema is missing on
 * this environment, the area is uninhabited or the query fails — like the graceful fallbacks of
 * the worker loaders. The caller then stores NULL and the worker default (30) applies.
 */
async function computeCensusStats(studyArea: unknown) {
  const geometry = unwrapGeometry(studyArea)
  if (geometry == null) return null

  const geojson = JSON.stringify(geometry)
  try {
    return await geoDataClient.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`

        // Deliberately temp tables instead of one big CTE query: the grid sample looks up the
        // sources for every point, and CTE results have no index. Without the GiST indexes below
        // this becomes a nested loop over all sources — 30 s instead of 1 s in testing.
        await tx.$executeRaw`
          CREATE TEMP TABLE census_area ON COMMIT DROP AS
          SELECT
            ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326), ${METRIC_SRID}) AS metric,
            ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326), ${SOURCE_SRID}) AS source`

        // Buildings in the area. The ramp measures from the building edge, so the polygons are
        // the source geometry, not the census points (which sit on the building centroid).
        // Includes buildings up to the tolerance outside the area: a census point at the edge
        // may belong to one of them. (EPSG:5243 is metric.)
        await tx.$executeRaw`
          CREATE TEMP TABLE census_buildings ON COMMIT DROP AS
          SELECT row_number() OVER () AS bid, ST_Transform(b.geom, ${METRIC_SRID}) AS geom
          FROM census_area a
          JOIN public."_buildings" b ON ST_DWithin(b.geom, a.source, ${CENSUS_BUILDING_TOLERANCE_M})`
        await tx.$executeRaw`CREATE INDEX ON census_buildings USING gist (geom)`

        await tx.$executeRaw`
          CREATE TEMP TABLE census_points ON COMMIT DROP AS
          SELECT c.total::double precision AS ew, ST_Transform(c.geom, ${METRIC_SRID}) AS geom
          FROM census_area a
          JOIN data."census_population_point" c ON c.geom && a.source AND ST_Intersects(c.geom, a.source)
          WHERE c.total > 0`
        await tx.$executeRaw`CREATE INDEX ON census_points USING gist (geom)`
        await tx.$executeRaw`ANALYZE census_buildings, census_points`

        // Aggregate points onto the nearest building within the tolerance (a point inside a
        // building has distance 0 and keeps it); points with no building nearby stay point
        // sources so no residents get lost. Same rule as `_census_demand_sources` in the worker.
        await tx.$executeRaw`
          CREATE TEMP TABLE census_sources ON COMMIT DROP AS
          WITH matched AS (
            SELECT p.ew, p.geom,
              (
                SELECT b.bid FROM census_buildings b
                WHERE ST_DWithin(p.geom, b.geom, ${CENSUS_BUILDING_TOLERANCE_M})
                ORDER BY ST_Distance(p.geom, b.geom)
                LIMIT 1
              ) AS bid
            FROM census_points p
          )
          SELECT sum(m.ew) AS ew, (SELECT b.geom FROM census_buildings b WHERE b.bid = m.bid) AS geom
          FROM matched m WHERE m.bid IS NOT NULL GROUP BY m.bid
          UNION ALL
          SELECT m.ew, m.geom FROM matched m WHERE m.bid IS NULL`
        await tx.$executeRaw`CREATE INDEX ON census_sources USING gist (geom)`
        await tx.$executeRaw`ANALYZE census_sources`

        // Sample: grid points in the area that are not on a building. The scorer deliberately
        // gives building footprints 0 (demand arises around the house, not on it).
        const rows = await tx.$queryRaw<{ p90: number | null; ew_pro_ha: number | null }[]>`
          WITH sample AS (
            SELECT (
              SELECT sum(s.ew * (1 - ST_Distance(g.geom, s.geom) / ${DEMAND_RADIUS_M}))
              FROM census_sources s
              WHERE ST_DWithin(g.geom, s.geom, ${DEMAND_RADIUS_M})
            ) AS bewohner_ew
            FROM (
              SELECT ST_Centroid(cell.geom) AS geom
              FROM census_area a, ST_SquareGrid(${SAMPLE_GRID_M}, a.metric) cell
              WHERE ST_Intersects(ST_Centroid(cell.geom), a.metric)
            ) g
            WHERE NOT EXISTS (SELECT 1 FROM census_buildings b WHERE ST_Intersects(g.geom, b.geom))
          )
          SELECT
            (SELECT percentile_cont(0.9) WITHIN GROUP (ORDER BY bewohner_ew)
             FROM sample WHERE bewohner_ew > 0)::double precision AS p90,
            (SELECT sum(p.ew) / (SELECT ST_Area(metric) / 10000 FROM census_area)
             FROM census_points p)::double precision AS ew_pro_ha`

        const p90 = rows[0]?.p90
        const ewPerHa = rows[0]?.ew_pro_ha
        if (p90 == null || !Number.isFinite(p90) || p90 <= 0) return null
        const stats: CensusStats = {
          saettigungEw: Math.min(MAX_SUGGESTION, Math.max(MIN_SUGGESTION, roundSuggestion(p90))),
          ewPerHa: ewPerHa != null && Number.isFinite(ewPerHa) ? Math.round(ewPerHa * 10) / 10 : 0,
        }
        return stats
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    console.error('Could not compute census saturation:', error)
    return null
  }
}

/** Recomputes and writes the result to the Planungsgebiet — after creation and after every
 * geometry change. If the query fails, the values are reset to NULL so no suggestion for an
 * old geometry remains. */
export async function refreshAreaCensusStats(areaId: number, studyArea: unknown) {
  const stats = await computeCensusStats(studyArea)
  await db.planningArea.update({
    where: { id: areaId },
    data: {
      censusSaettigungEw: stats?.saettigungEw ?? null,
      censusEwPerHa: stats?.ewPerHa ?? null,
      censusComputedAt: new Date(),
    },
  })
  return stats
}

/** Backfills the stats for areas created before this feature. Only computes while
 * `censusComputedAt` is NULL — afterwards only via `refreshAreaCensusStats`. */
export async function ensureAreaCensusStats(areaId: number) {
  const area = await db.planningArea.findUnique({
    where: { id: areaId },
    select: { studyArea: true, censusComputedAt: true },
  })
  if (area == null || area.censusComputedAt != null) return null
  return refreshAreaCensusStats(areaId, area.studyArea)
}

/** Reduce GeoJSON to the bare geometry — areas come as Feature, FeatureCollection or geometry
 * (same normalization as `planning_census`). Exported because
 * `parkingDataAvailability.server.ts` needs the same normalization. */
export function unwrapGeometry(studyArea: unknown) {
  const geo = studyArea as {
    type?: string
    geometry?: unknown
    features?: { geometry?: unknown }[]
  }
  if (geo == null || typeof geo !== 'object') return null
  if (geo.type === 'FeatureCollection') return geo.features?.[0]?.geometry ?? null
  if (geo.type === 'Feature') return geo.geometry ?? null
  return geo.type == null ? null : geo
}
