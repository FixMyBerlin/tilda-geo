import { styleText } from 'node:util'

// Germany's bounding box in WGS84 coordinates
const GERMANY_BBOX = {
  minLon: 5.866,
  maxLon: 15.042,
  minLat: 47.27,
  maxLat: 55.058,
} as const

/**
 * Extracts coordinates from a GeoJSON geometry, handling different geometry types
 */
function extractCoordinates(geometry: any): [number, number] | null {
  if (!geometry || !geometry.coordinates) return null

  const coords = geometry.coordinates

  switch (geometry.type) {
    case 'Point':
      return coords as [number, number]

    case 'LineString':
    case 'MultiPoint':
      return coords[0] as [number, number]

    case 'Polygon':
    case 'MultiLineString':
      return coords[0][0] as [number, number]

    case 'MultiPolygon':
      return coords[0][0][0] as [number, number]

    default:
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
export function validateProjection(geojson: any, filename: string): boolean {
  // Check if we have valid GeoJSON structure
  if (
    !geojson ||
    !geojson.features ||
    !Array.isArray(geojson.features) ||
    geojson.features.length === 0
  ) {
    console.log(
      styleText('yellow', `  WARNING: Cannot validate projection - no features found in ${filename}`),
    )
    return true // Don't fail validation for empty/invalid structure - let other validators handle this
  }

  // Find the first feature with valid geometry
  let firstValidCoords: [number, number] | null = null
  let featureIndex = -1

  for (let i = 0; i < geojson.features.length && !firstValidCoords; i++) {
    const feature = geojson.features[i]
    if (feature && feature.geometry) {
      firstValidCoords = extractCoordinates(feature.geometry)
      if (firstValidCoords) {
        featureIndex = i
      }
    }
  }

  if (!firstValidCoords) {
    console.log(
      styleText('yellow', `  WARNING: Cannot validate projection - no valid coordinates found in ${filename}`),
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
      styleText('red', `    First feature (index ${featureIndex}) coordinates: [${longitude}, ${latitude}]`),
    )
    console.log(styleText('red', `    Expected coordinates within Germany's bounding box:`))
    console.log(styleText('red', `    Longitude: ${GERMANY_BBOX.minLon} to ${GERMANY_BBOX.maxLon}`))
    console.log(styleText('red', `    Latitude: ${GERMANY_BBOX.minLat} to ${GERMANY_BBOX.maxLat}`))
    console.log(
      styleText('red', `    This suggests the data might be in a projected coordinate system (e.g., UTM) instead of WGS84.`),
    )
    return false
  }

  console.log(`  ✓ Projection validation passed - coordinates appear to be in WGS84`)
  return true
}
