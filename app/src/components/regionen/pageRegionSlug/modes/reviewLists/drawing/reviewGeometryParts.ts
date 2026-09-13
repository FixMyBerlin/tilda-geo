import { multiLineString, multiPoint, multiPolygon } from '@turf/helpers'

export type ReviewGeometryFamily = 'point' | 'linestring' | 'polygon'

const FAMILY_SINGLE_TYPE = {
  point: 'Point',
  linestring: 'LineString',
  polygon: 'Polygon',
} as const satisfies Record<ReviewGeometryFamily, GeoJSON.GeoJsonTypes>

export const reviewGeometryFamilyForType = (type: string) => {
  if (type === 'Point' || type === 'MultiPoint') return 'point' as const
  if (type === 'LineString' || type === 'MultiLineString') return 'linestring' as const
  if (type === 'Polygon' || type === 'MultiPolygon') return 'polygon' as const
  return null
}

/** Split a GeoJSON geometry into terra-draw-compatible single-part geometries. */
export const splitGeometryIntoParts = (geometry: GeoJSON.Geometry) => {
  switch (geometry.type) {
    case 'Point':
      return { family: 'point' as const, parts: [geometry] }
    case 'MultiPoint':
      return {
        family: 'point' as const,
        parts: geometry.coordinates.map(
          (coordinates) => ({ type: 'Point', coordinates }) satisfies GeoJSON.Point,
        ),
      }
    case 'LineString':
      return { family: 'linestring' as const, parts: [geometry] }
    case 'MultiLineString':
      return {
        family: 'linestring' as const,
        parts: geometry.coordinates.map(
          (coordinates) => ({ type: 'LineString', coordinates }) satisfies GeoJSON.LineString,
        ),
      }
    case 'Polygon':
      return { family: 'polygon' as const, parts: [geometry] }
    case 'MultiPolygon':
      return {
        family: 'polygon' as const,
        parts: geometry.coordinates.map(
          (coordinates) => ({ type: 'Polygon', coordinates }) satisfies GeoJSON.Polygon,
        ),
      }
    case 'GeometryCollection':
      return null
  }
}

/** True when a recombined edit geometry should be persisted (differs from the loaded baseline). */
export const reviewEditGeometryChanged = (
  loaded: GeoJSON.Geometry | null | undefined,
  current: GeoJSON.Geometry | null | undefined,
) => {
  if (!current) return false
  if (!loaded) return true
  return JSON.stringify(loaded) !== JSON.stringify(current)
}

/** Recombine same-family parts: 1 → Point/LineString/Polygon, N → Multi*, 0 → null. */
export const combinePartsIntoGeometry = (
  family: ReviewGeometryFamily,
  parts: GeoJSON.Geometry[],
) => {
  const matching = parts.filter((part) => part.type === FAMILY_SINGLE_TYPE[family])
  if (matching.length === 0) return null
  if (matching.length === 1) return matching[0] ?? null

  if (family === 'point') {
    const coordinates = matching.flatMap((part) =>
      part.type === 'Point' ? [part.coordinates] : [],
    )
    return multiPoint(coordinates).geometry
  }
  if (family === 'linestring') {
    const coordinates = matching.flatMap((part) =>
      part.type === 'LineString' ? [part.coordinates] : [],
    )
    return multiLineString(coordinates).geometry
  }
  const coordinates = matching.flatMap((part) =>
    part.type === 'Polygon' ? [part.coordinates] : [],
  )
  return multiPolygon(coordinates).geometry
}
