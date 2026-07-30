import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { geoDataClient } from '@/server/prisma-client.server'

const geojsonPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const geojsonMultipolygon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
})
const boundaryGeometrySchema = z.discriminatedUnion('type', [geojsonPolygon, geojsonMultipolygon])

export class BoundaryNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BoundaryNotFoundError'
  }
}

/** Union OSM relation boundaries from the geo DB (same logic as GET /api/boundary). */
export async function fetchBoundaryGeometry(osmRelationIds: number[]) {
  const uniqueIds = [...new Set(osmRelationIds)]
  const ids = uniqueIds.map((id) => BigInt(id))

  const nHits = await geoDataClient.$executeRaw`
    SELECT osm_id
    FROM boundaries
    WHERE osm_id IN (${Prisma.join(ids)})
  `
  if (nHits !== uniqueIds.length) {
    throw new BoundaryNotFoundError(
      "Couldn't find given ids. At least one id is wrong or missing from the boundaries database.",
    )
  }

  const boundary = await geoDataClient.$queryRaw<Array<Record<'geom', unknown>>>`
    SELECT ST_AsGeoJSON(ST_Transform(ST_UNION(geom), 4326))::jsonb AS geom
    FROM boundaries
    WHERE osm_id IN (${Prisma.join(ids)})
  `
  const geom = boundary?.at(0)?.geom
  if (!geom) {
    throw new Error('Boundary query returned no geometry')
  }

  return boundaryGeometrySchema.parse(geom)
}
