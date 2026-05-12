import { styleText } from 'node:util'
import type { Geometry } from 'geojson'

// Germany's bounding box in WGS84 coordinates
const GERMANY_BBOX = {
  minLon: 5.866,
  maxLon: 15.042,
  minLat: 47.27,
  maxLat: 55.058,
} as const

type Position = [number, number]

function toPosition(coords: number[] | undefined) {
  if (!coords) return null
  const [lon, lat] = coords
  if (typeof lon !== 'number' || typeof lat !== 'number') return null
  return [lon, lat] satisfies Position
}

function extractCoordinates(geometry: Geometry) {
  switch (geometry.type) {
    case 'Point':
      return toPosition(geometry.coordinates)
    case 'LineString':
    case 'MultiPoint':
      return toPosition(geometry.coordinates[0])
    case 'Polygon':
    case 'MultiLineString':
      return toPosition(geometry.coordinates[0]?.[0])
    case 'MultiPolygon':
      return toPosition(geometry.coordinates[0]?.[0]?.[0])
    case 'GeometryCollection':
      return null
  }
}

/**
 * Validates that GeoJSON coordinates are in WGS84 projection by checking
 * if the first feature's coordinates fall within Germany's bounding box.
 *
 * This is a simple but effective check to catch common projection errors
 * where coordinates are in UTM or other projected coordinate systems
 * (e.g., 50403.212 instead of 12.123).
 */

type GeoJsonWithFeatures = {
  features: Array<{ geometry?: Geometry }>
}

function hasFeatures(v: unknown): v is GeoJsonWithFeatures {
  return (
    typeof v === 'object' &&
    v !== null &&
    'features' in v &&
    Array.isArray((v as GeoJsonWithFeatures).features)
  )
}

export function validateProjection(geojson: unknown, filename: string) {
  if (!hasFeatures(geojson) || geojson.features.length === 0) {
    console.log(
      styleText(
        'yellow',
        `  WARNING: Cannot validate projection - no features found in ${filename}`,
      ),
    )
    return true // Don't fail validation for empty/invalid structure - let other validators handle this
  }

  let firstValidCoords: Position | null = null
  let featureIndex = -1
  for (let i = 0; i < geojson.features.length; i++) {
    const feature = geojson.features[i]
    const geometry = feature?.geometry
    if (!geometry) continue
    const coords = extractCoordinates(geometry)
    if (coords) {
      firstValidCoords = coords
      featureIndex = i
      break
    }
  }

  if (firstValidCoords === null) {
    console.log(
      styleText(
        'yellow',
        `  WARNING: Cannot validate projection - no valid coordinates found in ${filename}`,
      ),
    )
    return true // Don't fail validation if we can't extract coordinates
  }

  const [longitude, latitude] = firstValidCoords

  // Check if coordinates are within Germany's bounding box
  const isWithinBounds =
    longitude >= GERMANY_BBOX.minLon &&
    longitude <= GERMANY_BBOX.maxLon &&
    latitude >= GERMANY_BBOX.minLat &&
    latitude <= GERMANY_BBOX.maxLat

  if (!isWithinBounds) {
    console.log(styleText('red', `  ERROR: Projection validation failed for ${filename}`))
    console.log(
      styleText(
        'red',
        `    First feature (index ${featureIndex}) coordinates: [${longitude}, ${latitude}]`,
      ),
    )
    console.log(styleText('red', `    Expected coordinates within Germany's bounding box:`))
    console.log(styleText('red', `    Longitude: ${GERMANY_BBOX.minLon} to ${GERMANY_BBOX.maxLon}`))
    console.log(styleText('red', `    Latitude: ${GERMANY_BBOX.minLat} to ${GERMANY_BBOX.maxLat}`))
    console.log(
      styleText(
        'red',
        `    This suggests the data might be in a projected coordinate system (e.g., UTM) instead of WGS84.`,
      ),
    )
    return false
  }

  console.log(`  ✓ Projection validation passed - coordinates appear to be in WGS84`)
  return true
}
