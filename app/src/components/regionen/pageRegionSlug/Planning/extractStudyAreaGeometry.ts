import { check } from '@placemarkio/check-geojson'

/**
 * Normalises arbitrary GeoJSON input (Geometry / Feature / FeatureCollection) to a single
 * `Polygon` or `MultiPolygon` geometry suitable for `factorConfig.study_area`.
 *
 * Throws a user-facing (German) Error when the input is not exactly one polygonal area.
 * Used by both the GeoJSON upload and the map drawing flows so the rules stay identical.
 */
export type StudyAreaGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon

const ONLY_POLYGON_MSG = 'Bitte genau ein Polygon oder MultiPolygon hochladen.'

const isPolygonal = (geom: GeoJSON.Geometry | null | undefined): geom is StudyAreaGeometry =>
  geom?.type === 'Polygon' || geom?.type === 'MultiPolygon'

/** Parse a GeoJSON string (e.g. an uploaded file) and extract the single study-area geometry. */
export function parseStudyAreaGeometry(jsonStr: string): StudyAreaGeometry {
  let parsed: GeoJSON.GeoJSON
  try {
    parsed = check(jsonStr)
  } catch (error) {
    throw new Error(`Ungültiges GeoJSON: ${(error as Error).message}`)
  }
  return extractStudyAreaGeometry(parsed)
}

/** Extract the single study-area geometry from an already-parsed GeoJSON object. */
export function extractStudyAreaGeometry(input: GeoJSON.GeoJSON): StudyAreaGeometry {
  if (input.type === 'FeatureCollection') {
    const polygonal = input.features.filter((f) => isPolygonal(f.geometry))
    if (polygonal.length !== 1) throw new Error(ONLY_POLYGON_MSG)
    return polygonal[0]!.geometry as StudyAreaGeometry
  }
  if (input.type === 'Feature') {
    if (!isPolygonal(input.geometry)) throw new Error(ONLY_POLYGON_MSG)
    return input.geometry
  }
  if (isPolygonal(input)) return input
  throw new Error(ONLY_POLYGON_MSG)
}
