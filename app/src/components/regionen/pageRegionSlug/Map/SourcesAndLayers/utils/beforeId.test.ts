import { describe, expect, test } from 'vitest'
import { beforeIdOnBackground, LAYER_POSITIONS, layerPosition } from './beforeId'

describe('layerPosition', () => {
  test('the layer type gives the default position', () => {
    expect(layerPosition({ layer: { type: 'fill' }, subcategoryBeforeId: undefined })).toBe(
      'landuse',
    )
    expect(layerPosition({ layer: { type: 'line' }, subcategoryBeforeId: undefined })).toBe(
      'boundary_country',
    )
    expect(layerPosition({ layer: { type: 'symbol' }, subcategoryBeforeId: undefined })).toBe(
      'housenumber',
    )
  })

  test('admin wins over the layer config, which wins over the subcategory config', () => {
    const layer = { type: 'line' as const, beforeId: 'building' as const }
    const subcategoryBeforeId = 'atlas-app-beforeid-top'
    expect(layerPosition({ layer: { type: 'line' }, subcategoryBeforeId })).toBe(
      subcategoryBeforeId,
    )
    expect(layerPosition({ layer, subcategoryBeforeId })).toBe('building')
    expect(
      layerPosition({ layer, subcategoryBeforeId, adminBeforeId: 'atlas-app-beforeid-group2' }),
    ).toBe('atlas-app-beforeid-group2')
  })
})

describe('beforeIdOnBackground', () => {
  test('the default background keeps every position', () => {
    for (const position of LAYER_POSITIONS) {
      expect(beforeIdOnBackground(position, 'default')).toBe(position)
    }
  })

  test('on a raster background, positions below it move right above it', () => {
    const onRaster = LAYER_POSITIONS.map((position) => beforeIdOnBackground(position, 'esri'))
    expect(onRaster).toEqual([
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'atlas-app-beforeid-below-roadname',
      'housenumber',
      'atlas-app-beforeid-group2',
      'atlas-app-beforeid-fallback',
      'atlas-app-beforeid-group1',
      'atlas-app-beforeid-top',
    ])
  })
})
