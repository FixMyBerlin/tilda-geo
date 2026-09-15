import { difference, feature, featureCollection, polygon } from '@turf/turf'
import type { MultiPolygon, Polygon } from 'geojson'

export function transformRegionMask({
  geometry,
  bufferedGeometry,
}: {
  geometry: Polygon | MultiPolygon
  bufferedGeometry: Polygon | MultiPolygon
}) {
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

  const mask = difference(featureCollection([worldPolygon, feature(bufferedGeometry, {})]))

  if (!mask) {
    throw new Error('Failed to create mask from region geometry')
  }

  const maskFeature = feature(mask.geometry, { mask: true, border: false })
  const borderFeature = feature(geometry, { mask: false, border: true })

  return featureCollection([maskFeature, borderFeature])
}
