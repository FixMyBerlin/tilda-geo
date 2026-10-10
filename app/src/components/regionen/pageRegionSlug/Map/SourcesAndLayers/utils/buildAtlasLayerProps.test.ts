import { describe, expect, test } from 'vitest'
import { layerVisibility } from '../../utils/layerVisibility'
import { buildAtlasLayerProps, type AtlasStyleLayer } from './buildAtlasLayerProps'

const lineLayer = {
  id: 'line_base',
  type: 'line',
  source: 'atlas_bikelanes',
  'source-layer': 'bikelanes',
} satisfies AtlasStyleLayer

const baseParams = {
  layer: lineLayer,
  layerId: 'source:atlas_bikelanes--subcat:bikelanes--style:default--layer:line_base',
  sourceKey: 'cat:radinfra_bikelanes--source:atlas_bikelanes--subcat:bikelanes',
  visibility: layerVisibility(true),
  debugLayerStyles: false,
}

describe('buildAtlasLayerProps', () => {
  test('the beforeId is the position on the default background', () => {
    const props = buildAtlasLayerProps({
      ...baseParams,
      backgroundId: 'default',
      position: 'boundary_country',
    })
    expect(props.beforeId).toBe('boundary_country')
  })

  test('the beforeId is right above the raster background for a position below it', () => {
    const props = buildAtlasLayerProps({
      ...baseParams,
      backgroundId: 'esri',
      position: 'boundary_country',
    })
    expect(props.beforeId).toBe('atlas-app-beforeid-below-roadname')
  })
})
