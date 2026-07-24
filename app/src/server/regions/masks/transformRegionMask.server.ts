import { buffer, difference, feature, featureCollection, polygon, simplify } from '@turf/turf'
import type { MultiPolygon, Polygon } from 'geojson'

export function transformRegionMask({
  geometry,
  bufferDistanceKm,
}: {
  geometry: Polygon | MultiPolygon
  bufferDistanceKm: number
}) {
  const regionFeature = feature(geometry, {})
  const regionCollection = featureCollection([regionFeature])

  const simplifiedRegion = simplify(regionCollection, { tolerance: 0.0001, highQuality: false })

  const bufferedResult = buffer(simplifiedRegion, bufferDistanceKm, { units: 'kilometers' })
  if (!bufferedResult) {
    throw new Error('Failed to buffer region geometry')
  }

  if (bufferedResult.features.length === 0) {
    throw new Error('Failed to get buffered features')
  }

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

  const maskFeature = feature(mask.geometry, { mask: true, border: false })
  const borderFeature = feature(geometry, { mask: false, border: true })

  return featureCollection([maskFeature, borderFeature])
}
