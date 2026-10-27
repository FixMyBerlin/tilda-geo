import { check } from '@placemarkio/check-geojson'
import { bbox, booleanIntersects, booleanWithin } from '@turf/turf'
import { z } from 'zod'

// Limits for the user-uploaded Eigendaten GeoJSON. Client AND server
// enforce the same values (the server doesn't trust the client).
export const MAX_USER_GEOJSON_BYTES = 8 * 1024 * 1024 // 8 MB
export const MAX_USER_GEOJSON_FEATURES = 10_000
const MAX_USER_GEOJSON_COORDS = 500_000

// Limits for the dataset list of a Planungsgebiet.
export const MAX_USER_DATASETS = 10
export const MAX_USER_DATASETS_BYTES = 16 * 1024 * 1024 // 16 MB total
export const MAX_USER_DATASET_NAME_LENGTH = 80

const UserDatasetModeSchema = z.enum(['bonus', 'penalty', 'exclude_inside', 'exclude_outside'], {
  error: 'Eigene Daten: ungültiger Modus.',
})
export type UserDatasetMode = z.infer<typeof UserDatasetModeSchema>

/**
 * The stored dataset list (`PlanningArea.userDatasets`, run snapshots). It was validated with
 * `sanitizeUserDatasets` on write; the geometry is not validated again here.
 */
export const StoredUserDatasetsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    mode: UserDatasetModeSchema,
    geojson: z.custom<GeoJSON.FeatureCollection>(),
  }),
)

/**
 * An uploaded "Eigene Daten" dataset of a Planungsgebiet. Name, mode and geometry belong to the
 * area (apply to all variants); the strength per dataset is stored per variant in
 * `factorConfig.eigendaten_weights[id]`.
 */
export type UserDataset = z.infer<typeof StoredUserDatasetsSchema>[number]

/** What the client sends: `sanitizeUserGeojson` validates the geometry, `sanitizeUserDatasets` the list. */
const UserDatasetInputSchema = z.object({
  id: z
    .string({ error: 'Eigene Daten: ungültige Datensatz-ID.' })
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,32}$/, 'Eigene Daten: ungültige Datensatz-ID.'),
  name: z
    .string({ error: 'Der Name eines Datensatzes fehlt.' })
    .trim()
    .min(1, `Der Name eines Datensatzes braucht 1–${MAX_USER_DATASET_NAME_LENGTH} Zeichen.`)
    .max(
      MAX_USER_DATASET_NAME_LENGTH,
      `Der Name eines Datensatzes braucht 1–${MAX_USER_DATASET_NAME_LENGTH} Zeichen.`,
    ),
  mode: UserDatasetModeSchema,
  geojson: z.custom<GeoJSON.GeoJSON>(
    (value) => typeof value === 'object' && value !== null && 'type' in value,
    'Eigene Daten: Die Datei ist kein GeoJSON.',
  ),
})

const UserDatasetsInputSchema = z
  .array(UserDatasetInputSchema, { error: 'Eigene Daten: ungültige Datensatz-Liste.' })
  .max(MAX_USER_DATASETS, `Zu viele Datensätze (max. ${MAX_USER_DATASETS}).`)

/** Short ID for a new dataset, unique within the area. */
export const newUserDatasetId = (existing: UserDataset[]) => {
  const taken = new Set(existing.map((dataset) => dataset.id))
  let id = ''
  do {
    id = Math.random().toString(36).slice(2, 10)
  } while (id === '' || taken.has(id))
  return id
}

/** Comparison form of a name: names must be unique within the area (ignoring case and surrounding whitespace). */
const userDatasetNameKey = (name: string) => name.trim().toLocaleLowerCase('de-DE')

/** Does another dataset in the list already have the same (non-empty) name? */
export const isDuplicateUserDatasetName = (
  datasets: Pick<UserDataset, 'id' | 'name'>[],
  dataset: Pick<UserDataset, 'id' | 'name'>,
) => {
  const key = userDatasetNameKey(dataset.name)
  return (
    key !== '' &&
    datasets.some((other) => other.id !== dataset.id && userDatasetNameKey(other.name) === key)
  )
}

/**
 * File name without extension as the suggested dataset name; if already taken, „(2)“,
 * „(3)“ … is appended.
 */
export const defaultUserDatasetName = (
  fileName: string,
  existing: Pick<UserDataset, 'name'>[] = [],
) => {
  const base = (fileName.replace(/\.[^.]+$/, '').trim() || 'Eigene Daten').slice(
    0,
    MAX_USER_DATASET_NAME_LENGTH,
  )
  const taken = new Set(existing.map((dataset) => userDatasetNameKey(dataset.name)))
  let name = base
  for (let n = 2; taken.has(userDatasetNameKey(name)); n++) {
    const suffix = ` (${n})`
    name = `${base.slice(0, MAX_USER_DATASET_NAME_LENGTH - suffix.length)}${suffix}`
  }
  return name
}

/** Supported geometry types (points/lines/polygons; no GeometryCollection). */
const ALLOWED_GEOMETRY_TYPES = new Set<GeoJSON.GeoJsonGeometryTypes>([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
])

type UserGeometry =
  | GeoJSON.Point
  | GeoJSON.MultiPoint
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon

const isAllowed = (geom: GeoJSON.Geometry | null | undefined): geom is UserGeometry =>
  geom != null && ALLOWED_GEOMETRY_TYPES.has(geom.type)

/** Byte size of the serialized value (for `MAX_USER_GEOJSON_BYTES` / `MAX_USER_DATASETS_BYTES`). */
export function userGeojsonByteSize(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

// Walks the nested coordinate arrays recursively, checks each position for
// finite, plausible lon/lat values and counts the positions (DoS protection
// against huge geometries).
function validatePositions(coords: unknown, counter: { n: number }) {
  if (!Array.isArray(coords)) throw new Error('Ungültige Koordinaten im GeoJSON.')
  if (typeof coords[0] === 'number') {
    const lon = coords[0] as number
    const lat = coords[1] as number | undefined
    if (!Number.isFinite(lon) || lat == null || !Number.isFinite(lat))
      throw new Error('GeoJSON enthält ungültige (nicht-endliche) Koordinaten.')
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90)
      throw new Error(
        `GeoJSON-Koordinaten liegen außerhalb des gültigen Bereichs (Lon ${lon}, Lat ${lat}). ` +
          'Die Datei muss in WGS84 (EPSG:4326, Grad) vorliegen – vermutlich wurde sie in einem ' +
          'projizierten Koordinatensystem (z. B. UTM) exportiert.',
      )
    counter.n++
    return
  }
  for (const c of coords) validatePositions(c, counter)
}

/**
 * Normalizes and sanitizes arbitrary GeoJSON (Geometry / Feature /
 * FeatureCollection) into a minimal `FeatureCollection` for
 * an "Eigene Daten" dataset:
 *   - only supported geometry types (point/line/polygon),
 *   - `properties` are dropped (only geometry matters),
 *   - feature and coordinate caps (DoS protection),
 *   - coordinate plausibility (finite, lon/lat in valid range).
 * Throws a user-readable (German) error message on invalid input.
 * Used by both the client (upload) and the server (hard enforcement).
 */
export function sanitizeUserGeojson(input: GeoJSON.GeoJSON) {
  const geometries: UserGeometry[] = []

  switch (input.type) {
    case 'FeatureCollection':
      for (const f of input.features) if (isAllowed(f.geometry)) geometries.push(f.geometry)
      break
    case 'Feature':
      if (isAllowed(input.geometry)) geometries.push(input.geometry)
      break
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
    case 'MultiPolygon':
      geometries.push(input)
      break
    case 'GeometryCollection':
      break
  }

  if (geometries.length === 0)
    throw new Error('Keine unterstützten Geometrien (Punkte/Linien/Flächen) im GeoJSON gefunden.')
  if (geometries.length > MAX_USER_GEOJSON_FEATURES)
    throw new Error(`Zu viele Features (max. ${MAX_USER_GEOJSON_FEATURES}).`)

  const counter = { n: 0 }
  for (const geom of geometries) {
    validatePositions(geom.coordinates, counter)
    if (counter.n > MAX_USER_GEOJSON_COORDS)
      throw new Error(`Zu viele Koordinatenpunkte (max. ${MAX_USER_GEOJSON_COORDS}).`)
  }

  const collection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: geometries.map((geometry) => ({ type: 'Feature', geometry, properties: {} })),
  }
  return collection
}

/** Parse a raw uploaded GeoJSON string and return the sanitized FeatureCollection. */
export function parseUserGeojson(jsonStr: string) {
  if (new TextEncoder().encode(jsonStr).length > MAX_USER_GEOJSON_BYTES)
    throw new Error(`Datei zu groß (max. ${MAX_USER_GEOJSON_BYTES / 1024 / 1024} MB).`)
  let parsed: GeoJSON.GeoJSON
  try {
    parsed = check(jsonStr)
  } catch (error) {
    throw new Error(`Ungültiges GeoJSON: ${(error as Error).message}`)
  }
  return sanitizeUserGeojson(parsed)
}

/**
 * Validates and cleans the dataset list of a Planungsgebiet (client and server): count, unique
 * names and IDs, valid modes, the per-file limits from `sanitizeUserGeojson` and the total size.
 * Throws a user-readable error message.
 */
export function sanitizeUserDatasets(input: unknown) {
  const parsed = UserDatasetsInputSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message)

  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const datasets = parsed.data.map(({ id, name, mode, geojson: rawGeojson }) => {
    if (seenIds.has(id)) throw new Error('Eigene Daten: doppelte Datensatz-ID.')
    seenIds.add(id)
    // The name is the only label in the sidebar and Prüfliste — the same one twice would be ambiguous.
    if (seenNames.has(userDatasetNameKey(name)))
      throw new Error(`Eigene Daten: Der Name „${name}“ ist doppelt vergeben.`)
    seenNames.add(userDatasetNameKey(name))
    const geojson = sanitizeUserGeojson(rawGeojson)
    if (userGeojsonByteSize(geojson) > MAX_USER_GEOJSON_BYTES)
      throw new Error(
        `Eigene Daten „${name}“ zu groß (max. ${MAX_USER_GEOJSON_BYTES / 1024 / 1024} MB).`,
      )
    return { id, name, mode, geojson }
  })

  if (userGeojsonByteSize(datasets) > MAX_USER_DATASETS_BYTES)
    throw new Error(
      `Alle Datensätze zusammen sind zu groß (max. ${MAX_USER_DATASETS_BYTES / 1024 / 1024} MB).`,
    )
  return datasets
}

export type UserDatasetCoverage = {
  total: number
  /** Features completely outside the Planungsgebiet. */
  outside: number
  /** Features crossing the boundary (only partly inside the area). */
  partial: number
}

/**
 * Results per dataset object and area (as JSON). The check can take seconds with many features;
 * this way it runs only once per file and area state, even when the area form and the factors
 * block re-render. The WeakMap releases the entry together with the dataset.
 */
const coverageCache = new WeakMap<GeoJSON.FeatureCollection, Map<string, UserDatasetCoverage>>()

/**
 * How many features of a dataset lie (fully or partly) outside the Planungsgebiet?
 * Only computes a UI hint. Without an area there is nothing to compare.
 */
export function userDatasetCoverage(
  geojson: GeoJSON.FeatureCollection,
  studyArea: GeoJSON.Geometry | null | undefined,
) {
  const total = geojson.features.length
  if (!studyArea || (studyArea.type !== 'Polygon' && studyArea.type !== 'MultiPolygon'))
    return { total, outside: 0, partial: 0 }

  const areaKey = JSON.stringify(studyArea)
  let byArea = coverageCache.get(geojson)
  const cached = byArea?.get(areaKey)
  if (cached) return cached
  if (!byArea) {
    byArea = new Map()
    coverageCache.set(geojson, byArea)
  }
  const result = computeUserDatasetCoverage(geojson, studyArea)
  // Keep only the latest area state per file — drawing produces many intermediate states.
  byArea.clear()
  byArea.set(areaKey, result)
  return result
}

function computeUserDatasetCoverage(
  geojson: GeoJSON.FeatureCollection,
  area: GeoJSON.Polygon | GeoJSON.MultiPolygon,
) {
  const total = geojson.features.length
  const [minX, minY, maxX, maxY] = bbox(area)
  let outside = 0
  let partial = 0

  for (const feature of geojson.features) {
    const [fMinX, fMinY, fMaxX, fMaxY] = bbox(feature)
    // Bbox pre-check: skips the expensive geometry check for most features.
    if (fMaxX < minX || fMinX > maxX || fMaxY < minY || fMinY > maxY) {
      outside++
      continue
    }
    try {
      if (!booleanIntersects(feature, area)) outside++
      else if (!booleanWithin(feature, area)) partial++
    } catch {
      // Unusual geometry combination: better no false alarm.
    }
  }
  return { total, outside, partial }
}

/** Short text for the hint; `null` if everything lies within the Planungsgebiet. */
export function userDatasetCoverageMessage({ total, outside, partial }: UserDatasetCoverage) {
  if (total === 0 || (outside === 0 && partial === 0)) return null
  if (outside === total)
    return 'Alle Objekte liegen außerhalb des Planungsgebiets – falsche Datei oder falsches Gebiet?'
  const parts: string[] = []
  if (outside > 0)
    parts.push(
      `${outside} von ${total} Objekten ${outside === 1 ? 'liegt' : 'liegen'} außerhalb des Planungsgebiets`,
    )
  if (partial > 0)
    parts.push(
      `${partial} ${partial === 1 ? 'Objekt liegt' : 'Objekte liegen'} nur teilweise im Planungsgebiet`,
    )
  return parts.join(', ')
}
