import { polygon } from '@turf/turf'
import { describe, expect, it } from 'vitest'
import { transformRegionMask } from '@/server/regions/masks/transformRegionMask.server'

const square = polygon([
  [
    [13.0, 52.0],
    [13.1, 52.0],
    [13.1, 52.1],
    [13.0, 52.1],
    [13.0, 52.0],
  ],
])

const bufferedSquare = polygon([
  [
    [12.99, 51.99],
    [13.11, 51.99],
    [13.11, 52.11],
    [12.99, 52.11],
    [12.99, 51.99],
  ],
])

describe('transformRegionMask', () => {
  it('produces mask and border features from a simple polygon', () => {
    const result = transformRegionMask({
      geometry: square.geometry,
      bufferedGeometry: bufferedSquare.geometry,
    })

    expect(result.features).toHaveLength(2)
    const maskFeature = result.features.find((f) => f.properties?.mask === true)
    const borderFeature = result.features.find((f) => f.properties?.border === true)
    expect(maskFeature).toBeDefined()
    expect(borderFeature).toBeDefined()
    expect(borderFeature?.geometry).toEqual(square.geometry)
  })

  it('uses the unbuffered geometry as the border', () => {
    const withHole = polygon([
      [
        [13.0, 52.0],
        [13.1, 52.0],
        [13.1, 52.1],
        [13.0, 52.1],
        [13.0, 52.0],
      ],
      [
        [13.04, 52.04],
        [13.06, 52.04],
        [13.06, 52.06],
        [13.04, 52.06],
        [13.04, 52.04],
      ],
    ])

    const result = transformRegionMask({
      geometry: withHole.geometry,
      bufferedGeometry: bufferedSquare.geometry,
    })

    expect(result.features.find((f) => f.properties?.border === true)?.geometry).toEqual(
      withHole.geometry,
    )
  })
})
