import { describe, expect, test } from 'vitest'
import { buildUploadLayerProps, type UploadLayerWithAtlasType } from './buildUploadLayerProps'

const fillLayer = {
  id: 'test-fill',
  type: 'fill',
  paint: { 'fill-color': '#000' },
} satisfies UploadLayerWithAtlasType

const baseParams = {
  layerId: 'layer-1',
  sourceId: 'source-1',
  debugLayerStyles: false,
}

describe('buildUploadLayerProps()', () => {
  test('forwards minzoom and maxzoom when they are numbers', () => {
    const result = buildUploadLayerProps({
      ...baseParams,
      layer: { ...fillLayer, minzoom: 10, maxzoom: 12 },
    })
    expect(result.minzoom).toBe(10)
    expect(result.maxzoom).toBe(12)
  })

  test('forwards minzoom 0', () => {
    const result = buildUploadLayerProps({
      ...baseParams,
      layer: { ...fillLayer, minzoom: 0 },
    })
    expect(result.minzoom).toBe(0)
    expect(result.maxzoom).toBeUndefined()
  })

  test('omits minzoom and maxzoom when they are not numbers', () => {
    const result = buildUploadLayerProps({
      ...baseParams,
      layer: fillLayer,
    })
    expect(result.minzoom).toBeUndefined()
    expect(result.maxzoom).toBeUndefined()
  })
})
