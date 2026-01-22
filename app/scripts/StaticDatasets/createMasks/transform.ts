import { buffer, difference, feature, featureCollection, polygon, simplify } from '@turf/turf'
import { MultiPolygon, Polygon } from 'geojson'

export function transformRegionToMask(
  regionGeojson: Polygon | MultiPolygon,
  bufferDistanceKm: number,
) {
  // API returns raw Polygon or MultiPolygon geometry, wrap it in a Feature
  const regionFeature = feature(regionGeojson, {})
  const regionCollection = featureCollection([regionFeature])

  const simplifiedRegion = simplify(regionCollection, { tolerance: 0.0001, highQuality: false })

  const bufferedResult = buffer(simplifiedRegion, bufferDistanceKm, { units: 'kilometers' })
  if (!bufferedResult) {
    throw new Error('Failed to buffer region geometry')
  }

  if (bufferedResult.features.length === 0) {
    throw new Error('Failed to get buffered features')
  }

  // Create world polygon
  const worldPolygon = polygon(
    [
      [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ],
    ],
    {},
  )

  const allFeaturesForDifference = [worldPolygon, ...bufferedResult.features]
  const mask = difference(featureCollection(allFeaturesForDifference))

  if (!mask) {
    throw new Error('Failed to create mask from region geometry')
  }

  return featureCollection([mask])
}
