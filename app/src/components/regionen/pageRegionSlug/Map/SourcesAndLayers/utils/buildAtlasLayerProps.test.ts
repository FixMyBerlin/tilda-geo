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
  test('admin beforeId wins over subcategory and type defaults on the default background', () => {
    const props = buildAtlasLayerProps({
      ...baseParams,
      backgroundId: 'default',
      subcategoryBeforeId: 'atlas-app-beforeid-top',
      adminBeforeId: 'atlas-app-beforeid-below-roadname',
    })
    expect(props.beforeId).toBe('atlas-app-beforeid-below-roadname')
  })

  test('custom raster backgrounds drop beforeId so data sits on top', () => {
    const props = buildAtlasLayerProps({
      ...baseParams,
      backgroundId: 'esri',
      subcategoryBeforeId: 'atlas-app-beforeid-top',
      adminBeforeId: 'atlas-app-beforeid-below-roadname',
    })
    expect(props.beforeId).toBeUndefined()
  })

  test('without an admin override, subcategory beforeId is used', () => {
    const props = buildAtlasLayerProps({
      ...baseParams,
      backgroundId: 'default',
      subcategoryBeforeId: 'atlas-app-beforeid-top',
    })
    expect(props.beforeId).toBe('atlas-app-beforeid-top')
  })
})
