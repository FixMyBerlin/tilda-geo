import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import type { ReviewEntryGeometryType } from '@/prisma/generated/enums'
import {
  normalizeGeometry,
  normalizeProperties,
  resolveFeatureImportId,
  reviewFeatureCollectionSchema,
} from '@/shared/reviewLists/reviewEntryImport'

/**
 * GeoJSON ↔ ReviewEntry conversion + validation (pure, no DB) — shared by the upload and download
 * server functions and unit-tested directly.
 */

/** GeoJSON geometry type strings → our Prisma enum. GeometryCollection is intentionally unsupported. */
const GEOJSON_TYPE_TO_ENUM = {
  Point: 'POINT',
  LineString: 'LINESTRING',
  Polygon: 'POLYGON',
  MultiPoint: 'MULTIPOINT',
  MultiLineString: 'MULTILINESTRING',
  MultiPolygon: 'MULTIPOLYGON',
} as const satisfies Record<string, ReviewEntryGeometryType>

/** All leaves of a GeoJSON coordinates array must be finite numbers (any nesting depth). */
const hasOnlyFiniteNumberLeaves = (coordinates: unknown[]): boolean =>
  coordinates.every((value) =>
    Array.isArray(value)
      ? hasOnlyFiniteNumberLeaves(value)
      : typeof value === 'number' && Number.isFinite(value),
  )

/** Single-geometry Zod schema shared by upload validation and manual draw create. */
export const reviewEntryGeometrySchema = z.object({
  type: z.enum(Object.keys(GEOJSON_TYPE_TO_ENUM) as [string, ...string[]]),
  // Nesting depth varies by type; we don't enforce per-type depth, but every coordinate leaf must
  // be a finite number so we never persist/serve structurally broken geometry.
  coordinates: z
    .array(z.any())
    .min(1)
    .refine(hasOnlyFiniteNumberLeaves, 'coordinates must contain only finite numbers'),
})

export type ReviewEntryData = {
  geometry: unknown
  geometryType: ReviewEntryGeometryType
  properties: Record<string, string>
  importId: string
}

/** Validate + map a parsed FeatureCollection to ReviewEntry rows (normalized props, 8dp geometry, resolved importId). Throws (ZodError) on invalid input. */
export const featureCollectionToEntries = (input: unknown): ReviewEntryData[] => {
  const collection = reviewFeatureCollectionSchema.parse(input)
  return collection.features.map((feature) => {
    const { importId } = resolveFeatureImportId(feature, feature.properties)
    return {
      geometry: normalizeGeometry(feature.geometry),
      geometryType:
        GEOJSON_TYPE_TO_ENUM[feature.geometry.type as keyof typeof GEOJSON_TYPE_TO_ENUM],
      properties: normalizeProperties(feature.properties),
      importId,
    }
  })
}

export const geojsonTypeToEnum = (type: string) => {
  const value = GEOJSON_TYPE_TO_ENUM[type as keyof typeof GEOJSON_TYPE_TO_ENUM]
  if (!value) throw new Error(`Unsupported GeoJSON geometry type: ${type}`)
  return value
}

type EntryForFeature = {
  id: number
  geometry: Prisma.JsonValue
  properties: Prisma.JsonValue
  status: string
  source: string
  importId?: string | null
  _count?: { comments: number }
}

/** Serialize ReviewEntry rows to a GeoJSON FeatureCollection (download). */
export const entriesToFeatureCollection = (entries: EntryForFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: entries.map((entry) => ({
    type: 'Feature' as const,
    id: entry.id,
    geometry: entry.geometry,
    properties: {
      ...(entry.properties && typeof entry.properties === 'object' ? entry.properties : {}),
      ...(entry.importId ? { tilda_importId: entry.importId } : {}),
      tilda_reviewEntryId: entry.id,
      tilda_status: entry.status,
      tilda_source: entry.source,
      ...(entry._count ? { tilda_commentCount: entry._count.comments } : {}),
    },
  })),
})
