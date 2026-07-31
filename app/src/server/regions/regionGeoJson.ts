import type { BBox } from 'geojson'
import { z } from 'zod'

/** GeoJSON 2D bbox stored on Region: [minLng, minLat, maxLng, maxLat]. */
export type RegionGeoJsonBBox = BBox & [number, number, number, number]

export const regionGeoJsonBBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()])

const regionCacheWarmingSchema = z.object({
  minZoom: z.number().int(),
  maxZoom: z.number().int(),
  tables: z.array(z.string().min(1)),
})

export type RegionCacheWarmingConfig = z.infer<typeof regionCacheWarmingSchema>

export const parseRegionGeoJsonBBox = (value: unknown) => {
  const parsed = regionGeoJsonBBoxSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export const parseRegionCacheWarming = (value: unknown) => {
  const parsed = regionCacheWarmingSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export const staticBboxToGeoJson = (bbox: {
  min: readonly [number, number]
  max: readonly [number, number]
}): RegionGeoJsonBBox => [bbox.min[0], bbox.min[1], bbox.max[0], bbox.max[1]]

export const geoJsonBboxToFormFields = (bbox: RegionGeoJsonBBox | null) => {
  if (!bbox) {
    return { bboxMinLng: '', bboxMinLat: '', bboxMaxLng: '', bboxMaxLat: '' }
  }
  const [minLng, minLat, maxLng, maxLat] = bbox
  return {
    bboxMinLng: String(minLng),
    bboxMinLat: String(minLat),
    bboxMaxLng: String(maxLng),
    bboxMaxLat: String(maxLat),
  }
}

export const formFieldsToGeoJsonBbox = (
  minLng: number | null,
  minLat: number | null,
  maxLng: number | null,
  maxLat: number | null,
): RegionGeoJsonBBox | null => {
  if (minLng == null || minLat == null || maxLng == null || maxLat == null) return null
  return [minLng, minLat, maxLng, maxLat]
}
