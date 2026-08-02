import { flatten } from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import type { TerrainProfileLine } from '../types'

export const terrainProfileGeometryFromFeature = (feature: Feature) => {
  const geometry = feature.geometry
  if (geometry?.type !== 'LineString' && geometry?.type !== 'MultiLineString') {
    return null
  }

  if (geometry.type === 'LineString') {
    return geometry satisfies TerrainProfileLine
  }

  const flattened = flatten(feature)
  const lineFeatures = flattened.features.filter(
    (entry): entry is Feature<LineString> => entry.geometry.type === 'LineString',
  )
  if (lineFeatures.length === 0) return null

  const firstLine = lineFeatures[0]
  if (!firstLine) return null

  let longest: LineString = firstLine.geometry
  let longestLength = longest.coordinates.length

  for (const lineFeature of lineFeatures.slice(1)) {
    const coordinateCount = lineFeature.geometry.coordinates.length
    if (coordinateCount > longestLength) {
      longest = lineFeature.geometry
      longestLength = coordinateCount
    }
  }

  return longest satisfies TerrainProfileLine
}

export const terrainProfileGeometryFingerprint = (geometry: TerrainProfileLine) =>
  JSON.stringify(geometry.coordinates)

export const isTerrainProfileEligibleFeature = (feature: Feature) =>
  terrainProfileGeometryFromFeature(feature) !== null
