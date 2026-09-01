import { check } from '@placemarkio/check-geojson'

// Grenzen für das vom Nutzer hochgeladene Eigendaten-GeoJSON. Client UND Server
// erzwingen dieselben Werte (der Server vertraut dem Client nicht).
export const MAX_USER_GEOJSON_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_USER_GEOJSON_FEATURES = 5_000
const MAX_USER_GEOJSON_COORDS = 500_000

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
export function userGeojsonByteSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

// Läuft rekursiv durch die verschachtelten Koordinaten-Arrays, prüft jede
// Position auf endliche, plausible Lon/Lat-Werte und zählt die Positionen (DoS-
// Schutz gegen riesige Geometrien).
function validatePositions(coords: unknown, counter: { n: number }): void {
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
 * `factorConfig.user_geojson`:
 *   - nur unterstützte Geometrietypen (Punkt/Linie/Fläche),
 *   - `properties` werden verworfen (nur Geometrie zählt),
 *   - Feature- und Koordinaten-Obergrenzen (DoS-Schutz),
 *   - Koordinaten-Plausibilität (endlich, Lon/Lat im gültigen Bereich).
 * Wirft eine nutzerlesbare (deutsche) Fehlermeldung bei ungültigem Input.
 * Von Client (Upload) und Server (harte Durchsetzung) gleichermaßen genutzt.
 */
export function sanitizeUserGeojson(input: GeoJSON.GeoJSON): GeoJSON.FeatureCollection {
  const geometries: UserGeometry[] = []

  if (input.type === 'FeatureCollection') {
    for (const f of input.features) if (isAllowed(f.geometry)) geometries.push(f.geometry)
  } else if (input.type === 'Feature') {
    if (isAllowed(input.geometry)) geometries.push(input.geometry)
  } else if (isAllowed(input)) {
    geometries.push(input)
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

  return {
    type: 'FeatureCollection',
    features: geometries.map((geometry) => ({ type: 'Feature', geometry, properties: {} })),
  }
}

/** Parse a raw uploaded GeoJSON string and return the sanitized FeatureCollection. */
export function parseUserGeojson(jsonStr: string): GeoJSON.FeatureCollection {
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
