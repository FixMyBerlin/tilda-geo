import { polygon } from '@turf/turf'
import { describe, expect, it } from 'vitest'
import { transformRegionMask } from '@/server/regions/masks/transformRegionMask.server'

describe('transformRegionMask', () => {
  it('produces mask and border features from a simple polygon', () => {
    const square = polygon([
      [
        [13.0, 52.0],
        [13.1, 52.0],
        [13.1, 52.1],
        [13.0, 52.1],
        [13.0, 52.0],
      ],
    ])

    const result = transformRegionMask({
      geometry: square.geometry,
      bufferDistanceKm: 1,
    })

    expect(result.features).toHaveLength(2)
    const maskFeature = result.features.find((f) => f.properties?.mask === true)
    const borderFeature = result.features.find((f) => f.properties?.border === true)
    expect(maskFeature).toBeDefined()
    expect(borderFeature).toBeDefined()
  })
})
