import { z } from 'zod'

/** Reserved prefix for TILDA export/system keys. Stripped on import; rejected in the editor. */
export const TILDA_RESERVED_KEY_PREFIX = 'tilda_'

/** Max features accepted per upload (prototype guard against huge files). */
export const REVIEW_UPLOAD_MAX_FEATURES = 5000

const GEOJSON_GEOMETRY_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
] as const

/** All leaves of a GeoJSON coordinates array must be finite numbers (any nesting depth). */
const hasOnlyFiniteNumberLeaves = (coordinates: unknown[]): boolean =>
  coordinates.every((value) =>
    Array.isArray(value)
      ? hasOnlyFiniteNumberLeaves(value)
      : typeof value === 'number' && Number.isFinite(value),
  )

const geometrySchema = z.object({
  type: z.enum(GEOJSON_GEOMETRY_TYPES),
  coordinates: z
    .array(z.any())
    .min(1)
    .refine(hasOnlyFiniteNumberLeaves, 'coordinates must contain only finite numbers'),
})

const featureSchema = z.object({
  type: z.literal('Feature'),
  id: z.union([z.string(), z.number()]).optional(),
  geometry: geometrySchema,
  properties: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const reviewFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(featureSchema).max(REVIEW_UPLOAD_MAX_FEATURES),
})

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const coercePropertyValue = (value: unknown) => {
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

/** Drop `tilda_` keys and empty values; coerce the rest to trimmed strings. Invents no keys. */
export const normalizeProperties = (raw: unknown) => {
  if (!isPlainObject(raw)) return {}
  const properties: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith(TILDA_RESERVED_KEY_PREFIX)) continue
    if (value === null || value === undefined) continue
    const trimmed = coercePropertyValue(value).trim()
    if (trimmed === '') continue
    properties[key] = trimmed
  }
  return properties
}

const roundCoordinateLeaf = (value: number) => Number(value.toFixed(8))

const roundCoordinateLeaves = (value: unknown): unknown => {
  if (typeof value === 'number') return roundCoordinateLeaf(value)
  if (Array.isArray(value)) return value.map(roundCoordinateLeaves)
  return value
}

/** Round every coordinate leaf to 8 decimals (`Number(value.toFixed(8))`) for all six types. */
export const normalizeGeometry = (geometry: { type: string; coordinates: unknown }) => ({
  ...geometry,
  coordinates: roundCoordinateLeaves(geometry.coordinates),
})

const asNonEmptyId = (value: unknown) => {
  if (value === null || value === undefined) return undefined
  const trimmed = String(value).trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Import identity: `tilda_importId` → `properties.id` → `feature.id` → `tilda_reviewEntryId`,
 * else a generated UUID (`fromFile: false`).
 */
export const resolveFeatureImportId = (feature: { id?: unknown }, rawProps: unknown) => {
  const props = isPlainObject(rawProps) ? rawProps : {}
  const tildaImportId = asNonEmptyId(props.tilda_importId)
  if (tildaImportId) {
    return { importId: tildaImportId, fromFile: true as const, source: 'tilda_importId' as const }
  }
  const propertiesId = asNonEmptyId(props.id)
  if (propertiesId) {
    return { importId: propertiesId, fromFile: true as const, source: 'properties.id' as const }
  }
  const featureId = asNonEmptyId(feature.id)
  if (featureId) {
    return { importId: featureId, fromFile: true as const, source: 'feature.id' as const }
  }
  const reviewEntryId = asNonEmptyId(props.tilda_reviewEntryId)
  if (reviewEntryId) {
    return {
      importId: reviewEntryId,
      fromFile: true as const,
      source: 'tilda_reviewEntryId' as const,
    }
  }
  return { importId: crypto.randomUUID(), fromFile: false as const }
}

type MatchFeature = {
  id?: unknown
  importId?: string | null
  properties?: { importId?: string | null } | null
}

type ReviewImportFeature = z.infer<typeof reviewFeatureCollectionSchema>['features'][number]

/** Existing DB row ids vs source-file `importId` values — matched separately by provenance. */
export const buildMatchSets = (features: readonly MatchFeature[]) => {
  const entryIds = new Set<string>()
  const importIds = new Set<string>()
  for (const feature of features) {
    if (feature.id !== null && feature.id !== undefined) entryIds.add(String(feature.id))
    const importId = feature.importId ?? feature.properties?.importId
    if (importId) importIds.add(importId)
  }
  return { entryIds, importIds }
}

export type ClassifiedImportFeature = {
  /** Resolved import id — from the file, or a generated UUID used only as a preview key. */
  id: string
  fromFile: boolean
  geometryType: string
  properties: Record<string, string>
  /** Original parsed feature; uploaded unchanged so the server resolves ids itself. */
  feature: ReviewImportFeature
}

export type ImportFeatureClassification = {
  neu: ClassifiedImportFeature[]
  ignoriert: ClassifiedImportFeature[]
  ohneId: ClassifiedImportFeature[]
}

/**
 * Preview-only split: `fromFile` ids are matched / deduped (first wins); generated ids always
 * append as `ohneId`. The server does not re-check this — the client uploads only neu + ohneId.
 * A direct RPC with a full file can create duplicates (accepted trade-off to keep the server path simple).
 */
export const classifyImportFeatures = (
  collection: z.infer<typeof reviewFeatureCollectionSchema>,
  existingFeatures: readonly MatchFeature[],
) => {
  const { entryIds, importIds } = buildMatchSets(existingFeatures)
  const seenInFile = new Set<string>()
  const neu: ClassifiedImportFeature[] = []
  const ignoriert: ClassifiedImportFeature[] = []
  const ohneId: ClassifiedImportFeature[] = []

  for (const feature of collection.features) {
    const resolved = resolveFeatureImportId(feature, feature.properties)
    const { importId, fromFile } = resolved
    const item = {
      id: importId,
      fromFile,
      geometryType: feature.geometry.type,
      properties: normalizeProperties(feature.properties),
      feature,
    } satisfies ClassifiedImportFeature

    if (!fromFile) {
      ohneId.push(item)
      continue
    }
    const matchSet = resolved.source === 'tilda_reviewEntryId' ? entryIds : importIds
    if (seenInFile.has(importId) || matchSet.has(importId)) {
      ignoriert.push(item)
      continue
    }
    seenInFile.add(importId)
    neu.push(item)
  }

  return { neu, ignoriert, ohneId } satisfies ImportFeatureClassification
}
