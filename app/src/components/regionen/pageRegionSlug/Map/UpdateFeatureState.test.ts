import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test, vi } from 'vitest'
import { syncSelectedFeatureState } from './UpdateFeatureState'

const createFeature = (id: string, layerId = 'atlas_bikelanes-default') => {
  return {
    id,
    layer: { id: layerId },
  } as MapGeoJSONFeature
}

describe('syncSelectedFeatureState', () => {
  test('marks newly selected features as selected', () => {
    const setFeatureState = vi.fn()
    const map = { setFeatureState }
    const selectedFeature = createFeature('way/179183416')

    syncSelectedFeatureState({
      map,
      currentSelectedFeatures: [selectedFeature],
      previousSelectedFeatures: [],
    })

    expect(setFeatureState).toHaveBeenCalledWith(selectedFeature, { selected: true })
  })

  test('marks removed features as deselected', () => {
    const setFeatureState = vi.fn()
    const map = { setFeatureState }
    const previousFeature = createFeature('way/179183416')

    syncSelectedFeatureState({
      map,
      currentSelectedFeatures: [],
      previousSelectedFeatures: [previousFeature],
    })

    expect(setFeatureState).toHaveBeenCalledWith(previousFeature, { selected: false })
  })

  test('does not write feature state when selection has not changed', () => {
    const setFeatureState = vi.fn()
    const map = { setFeatureState }
    const feature = createFeature('way/179183416')

    syncSelectedFeatureState({
      map,
      currentSelectedFeatures: [feature],
      previousSelectedFeatures: [feature],
    })

    expect(setFeatureState).not.toHaveBeenCalled()
  })

  test('treats same feature id in different layers as separate state entries', () => {
    const setFeatureState = vi.fn()
    const map = { setFeatureState }
    const previousFeature = createFeature('way/179183416', 'layer-a')
    const currentFeature = createFeature('way/179183416', 'layer-b')

    syncSelectedFeatureState({
      map,
      currentSelectedFeatures: [currentFeature],
      previousSelectedFeatures: [previousFeature],
    })

    expect(setFeatureState).toHaveBeenNthCalledWith(1, previousFeature, { selected: false })
    expect(setFeatureState).toHaveBeenNthCalledWith(2, currentFeature, { selected: true })
  })
})
