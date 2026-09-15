import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { geoDataClient } from '@/server/prisma-client.server'
import { lookupBoundaryOsmIds } from '@/server/regions/masks/lookupBoundaryOsmIds.server'

const geojsonPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const geojsonMultipolygon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
})
const boundaryGeometrySchema = z.discriminatedUnion('type', [geojsonPolygon, geojsonMultipolygon])

/** Drop union-artifact holes smaller than 1 ha; keep real enclaves (e.g. a kreisfreie Stadt). */
const MASK_SLIVER_MIN_AREA_SQM = 10_000
/**
 * Same value processing `boundaries.sql` uses for admin_level 6. EPSG:3857 units, which are inflated
 * by 1/cos(latitude), so this is ~12 m on the ground in Germany — not 20 m.
 */
const MASK_SIMPLIFY_TOLERANCE_3857 = 20

export class BoundaryNotFoundError extends Error {
  constructor(readonly missingOsmIds: number[]) {
    super(
      `Couldn't find these ids in the boundaries database: ${missingOsmIds.join(', ') || '(none given)'}`,
    )
    this.name = 'BoundaryNotFoundError'
  }
}

/**
 * Union the given OSM relation boundaries in PostGIS, drop the sliver holes the union leaves along
 * shared borders, and simplify. `bufferedGeometry` is the same shape grown by `bufferDistanceKm`.
 */
export async function fetchBoundaryGeometry(osmRelationIds: number[], bufferDistanceKm = 0) {
  const { found, missing } = await lookupBoundaryOsmIds(osmRelationIds)
  if (missing.length > 0 || found.length === 0) {
    throw new BoundaryNotFoundError(missing)
  }
  const ids = found.map((id) => BigInt(id))

  const bufferMeters = bufferDistanceKm * 1000

  const boundary = await geoDataClient.$queryRaw<Array<Record<'geom' | 'buffered_geom', unknown>>>`
    WITH unioned AS (
      SELECT ST_CollectionExtract(ST_MakeValid(ST_Union(geom)), 3) AS geom
      FROM public.boundaries
      WHERE osm_id IN (${Prisma.join(ids)})
    ),
    parts AS (
      SELECT (ST_Dump(unioned.geom)).geom AS geom
      FROM unioned
    ),
    -- Rebuild every polygon from its exterior ring plus only those holes that are real enclaves.
    cleaned AS (
      SELECT ST_MakePolygon(
        ST_ExteriorRing(parts.geom),
        ARRAY(
          SELECT ST_InteriorRingN(parts.geom, ring.index)
          FROM generate_series(1, ST_NumInteriorRings(parts.geom)) AS ring(index)
          WHERE ST_Area(
            ST_Transform(
              ST_MakePolygon(ST_InteriorRingN(parts.geom, ring.index)),
              4326
            )::geography
          ) >= ${MASK_SLIVER_MIN_AREA_SQM}
        )
      ) AS geom
      FROM parts
    ),
    simplified AS (
      SELECT ST_Transform(
        ST_SimplifyPreserveTopology(ST_Union(geom), ${MASK_SIMPLIFY_TOLERANCE_3857}),
        4326
      ) AS geom
      FROM cleaned
    )
    SELECT
      ST_AsGeoJSON(simplified.geom)::jsonb AS geom,
      ST_AsGeoJSON(
        ST_Buffer(simplified.geom::geography, ${bufferMeters})::geometry
      )::jsonb AS buffered_geom
    FROM simplified
  `
  const geom = boundary?.at(0)?.geom
  const bufferedGeom = boundary?.at(0)?.buffered_geom
  if (!geom || !bufferedGeom) {
    throw new Error('Boundary query returned no geometry')
  }

  return {
    geometry: boundaryGeometrySchema.parse(geom),
    bufferedGeometry: boundaryGeometrySchema.parse(bufferedGeom),
  }
}
