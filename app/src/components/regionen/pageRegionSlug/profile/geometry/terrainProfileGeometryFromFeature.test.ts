import { describe, expect, test } from 'vitest'
import { terrainProfileGeometryFromFeature } from './terrainProfileGeometryFromFeature'

describe('terrainProfileGeometryFromFeature()', () => {
  test('returns LineString geometry unchanged', () => {
    const feature = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [9.0, 48.0],
          [9.1, 48.1],
        ],
      },
    }

    expect(terrainProfileGeometryFromFeature(feature)).toStrictEqual(feature.geometry)
  })

  test('returns null for non-line geometries', () => {
    const pointFeature = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Point' as const,
        coordinates: [9.0, 48.0],
      },
    }

    expect(terrainProfileGeometryFromFeature(pointFeature)).toBeNull()
  })
})
