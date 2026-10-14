import { check } from '@placemarkio/check-geojson'
import { bbox, booleanIntersects, booleanWithin } from '@turf/turf'
import { z } from 'zod'

// Grenzen für das vom Nutzer hochgeladene Eigendaten-GeoJSON. Client UND Server
// erzwingen dieselben Werte (der Server vertraut dem Client nicht).
export const MAX_USER_GEOJSON_BYTES = 8 * 1024 * 1024 // 8 MB
export const MAX_USER_GEOJSON_FEATURES = 10_000
const MAX_USER_GEOJSON_COORDS = 500_000

// Grenzen für die Liste der Datensätze eines Planungsgebiets.
export const MAX_USER_DATASETS = 10
export const MAX_USER_DATASETS_BYTES = 16 * 1024 * 1024 // 16 MB insgesamt
export const MAX_USER_DATASET_NAME_LENGTH = 80

const UserDatasetModeSchema = z.enum(['bonus', 'penalty', 'exclude_inside', 'exclude_outside'], {
  error: 'Eigene Daten: ungültiger Modus.',
})
export type UserDatasetMode = z.infer<typeof UserDatasetModeSchema>

/**
 * Die gespeicherte Datensatz-Liste (`PlanningArea.userDatasets`, Run-Snapshots). Sie wurde beim
 * Schreiben mit `sanitizeUserDatasets` geprüft; die Geometrie wird hier nicht noch einmal geprüft.
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
 * Ein hochgeladener Eigene-Daten-Datensatz eines Planungsgebiets. Name, Modus und Geometrie
 * gehören zum Gebiet (gelten für alle Varianten); die Stärke je Datensatz steht je Variante in
 * `factorConfig.eigendaten_weights[id]`.
 */
export type UserDataset = z.infer<typeof StoredUserDatasetsSchema>[number]

/** Was der Client schickt: Geometrie prüft `sanitizeUserGeojson`, die Liste `sanitizeUserDatasets`. */
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

/** Kurze, im Gebiet eindeutige ID für einen neuen Datensatz. */
export const newUserDatasetId = (existing: UserDataset[]) => {
  const taken = new Set(existing.map((dataset) => dataset.id))
  let id = ''
  do {
    id = Math.random().toString(36).slice(2, 10)
  } while (id === '' || taken.has(id))
  return id
}

/** Vergleichsform eines Namens: Namen müssen im Gebiet eindeutig sein (ohne Groß/klein, Ränder). */
const userDatasetNameKey = (name: string) => name.trim().toLocaleLowerCase('de-DE')

/** Trägt ein anderer Datensatz der Liste schon denselben (nicht leeren) Namen? */
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
 * Dateiname ohne Endung als Vorschlag für den Datensatznamen; ist er schon vergeben, mit „(2)“,
 * „(3)“ … dahinter.
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

/** Unterstützte Geometrietypen (Punkte/Linien/Flächen; keine GeometryCollection). */
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

/** Byte-Größe des serialisierten Werts (für das 5-MB-Limit auf Server-Seite). */
export function userGeojsonByteSize(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

// Läuft rekursiv durch die verschachtelten Koordinaten-Arrays, prüft jede
// Position auf endliche, plausible Lon/Lat-Werte und zählt die Positionen (DoS-
// Schutz gegen riesige Geometrien).
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
 * Normalisiert und sanitisiert beliebiges GeoJSON (Geometry / Feature /
 * FeatureCollection) zu einer minimalen `FeatureCollection` für
 * einen Eigene-Daten-Datensatz:
 *   - nur unterstützte Geometrietypen (Punkt/Linie/Fläche),
 *   - `properties` werden verworfen (nur Geometrie zählt),
 *   - Feature- und Koordinaten-Obergrenzen (DoS-Schutz),
 *   - Koordinaten-Plausibilität (endlich, Lon/Lat im gültigen Bereich).
 * Wirft eine nutzerlesbare (deutsche) Fehlermeldung bei ungültigem Input.
 * Von Client (Upload) und Server (harte Durchsetzung) gleichermaßen genutzt.
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
 * Prüft und bereinigt die Datensatz-Liste eines Planungsgebiets (Client und Server): Anzahl,
 * eindeutige Namen und IDs, gültige Modi, je Datei die Grenzen aus `sanitizeUserGeojson` und die
 * Gesamtgröße. Wirft eine nutzerlesbare Fehlermeldung.
 */
export function sanitizeUserDatasets(input: unknown) {
  const parsed = UserDatasetsInputSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message)

  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const datasets = parsed.data.map(({ id, name, mode, geojson: rawGeojson }) => {
    if (seenIds.has(id)) throw new Error('Eigene Daten: doppelte Datensatz-ID.')
    seenIds.add(id)
    // Der Name ist das einzige Etikett in Sidebar und Prüfliste — zweimal derselbe wäre mehrdeutig.
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
  /** Objekte komplett außerhalb des Planungsgebiets. */
  outside: number
  /** Objekte, die die Grenze schneiden (nur teilweise im Gebiet). */
  partial: number
}

/**
 * Ergebnisse je Datensatz-Objekt und Gebiet (als JSON). Die Prüfung kann bei vielen Objekten
 * Sekunden dauern; so läuft sie je Datei und Gebietsstand nur einmal, auch wenn Gebietsformular
 * und Faktoren-Block sie neu rendern. Die WeakMap gibt den Eintrag mit dem Datensatz frei.
 */
const coverageCache = new WeakMap<GeoJSON.FeatureCollection, Map<string, UserDatasetCoverage>>()

/**
 * Wie viele Objekte eines Datensatzes liegen (ganz oder teilweise) außerhalb des Planungsgebiets?
 * Reine Hinweis-Berechnung für die Oberfläche. Ohne Gebiet gibt es nichts zu vergleichen.
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
  // Nur den letzten Gebietsstand je Datei behalten — beim Zeichnen entstehen viele Zwischenstände.
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
    // Bbox-Vorprüfung: spart die teure Geometrieprüfung für die meisten Objekte.
    if (fMaxX < minX || fMinX > maxX || fMaxY < minY || fMinY > maxY) {
      outside++
      continue
    }
    try {
      if (!booleanIntersects(feature, area)) outside++
      else if (!booleanWithin(feature, area)) partial++
    } catch {
      // Ungewöhnliche Geometriekombination: lieber kein falscher Alarm.
    }
  }
  return { total, outside, partial }
}

/** Kurztext für den Hinweis; `null`, wenn alles im Planungsgebiet liegt. */
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
