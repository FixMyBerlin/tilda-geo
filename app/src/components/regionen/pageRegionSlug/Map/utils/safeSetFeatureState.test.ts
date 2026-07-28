import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test, vi } from 'vitest'
import { safeSetFeatureState } from './safeSetFeatureState'

const createFeature = ({
  id = 123,
  source = 'qa-source',
}: {
  id?: number | null
  source?: string
}) => {
  return { id, source } as MapGeoJSONFeature
}

const createMap = (existingSourceIds: string[]) => {
  const setFeatureState = vi.fn()
  const getSource = vi.fn((sourceId: string) => {
    return existingSourceIds.includes(sourceId) ? { id: sourceId } : undefined
  })

  return {
    setFeatureState,
    getMap: () => ({ getSource }),
  }
}

describe('safeSetFeatureState', () => {
  test('writes feature state when feature id and source exist', () => {
    const map = createMap(['qa-source'])
    const feature = createFeature({})

    safeSetFeatureState(map, feature, { hover: true })

    expect(map.setFeatureState).toHaveBeenCalledWith(feature, { hover: true })
  })

  test('skips write when source is missing', () => {
    const map = createMap([])
    const feature = createFeature({})

    safeSetFeatureState(map, feature, { selected: true })

    expect(map.setFeatureState).not.toHaveBeenCalled()
  })

  test('skips write when feature id is missing', () => {
    const map = createMap(['qa-source'])
    const feature = createFeature({ id: null })

    safeSetFeatureState(map, feature, { selected: true })

    expect(map.setFeatureState).not.toHaveBeenCalled()
  })
})
