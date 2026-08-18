import type { BBox } from 'geojson'
import { z } from 'zod'
import { SIMPLIFY_MAX_ZOOM, SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import { warmableTablesKeySet } from '@/server/regions/cacheWarmingSources'

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

const clampCacheWarmingZoom = (zoom: number) =>
  Math.min(SIMPLIFY_MAX_ZOOM, Math.max(SIMPLIFY_MIN_ZOOM, zoom))

/**
 * Lenient DB JSON → write-schema-safe cacheWarming (clamp zooms, drop unknown tables).
 * Used by `regionRowToWriteInput` so MCP/API round-trips do not fail RegionWriteSchema.
 */
export const cacheWarmingToWriteInput = (value: unknown) => {
  const parsed = parseRegionCacheWarming(value)
  if (!parsed) return null

  let minZoom = clampCacheWarmingZoom(parsed.minZoom)
  let maxZoom = clampCacheWarmingZoom(parsed.maxZoom)
  if (minZoom > maxZoom) {
    ;[minZoom, maxZoom] = [maxZoom, minZoom]
  }

  const tables = parsed.tables.filter((key) => warmableTablesKeySet.has(key))
  if (tables.length === 0) return null

  return { minZoom, maxZoom, tables }
}

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
