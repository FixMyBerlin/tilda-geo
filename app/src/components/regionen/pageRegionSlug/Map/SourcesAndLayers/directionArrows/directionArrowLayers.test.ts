import { featureFilter } from '@maplibre/maplibre-gl-style-spec'
import type { FilterSpecification } from 'maplibre-gl'
import type { LayerProps } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import {
  buildDirectionArrowLayers,
  DIRECTION_ARROWS_SELECTED_MINZOOM,
  type DirectionArrowLineEntry,
} from './directionArrowLayers'

const line = (
  id: string,
  extra: Partial<Extract<LayerProps, { type: 'line' }>> = {},
): Extract<LayerProps, { type: 'line' }> => ({
  id,
  type: 'line',
  source: 'src',
  'source-layer': 'lines',
  layout: { visibility: 'visible' },
  paint: {},
  ...extra,
})

const entry = (
  layerProps: LayerProps,
  extra: Partial<DirectionArrowLineEntry> = {},
): DirectionArrowLineEntry => ({
  sourceKey: 'src',
  sourceId: 'data',
  sourceLayer: 'lines',
  layerProps,
  ...extra,
})

const matches = (filter: FilterSpecification, properties: Record<string, unknown>) =>
  featureFilter(filter, 'layers[0].filter').filter({ zoom: 19 }, {
    type: 2,
    properties,
    geometry: [],
  } as never)

describe('buildDirectionArrowLayers', () => {
  test('one faint and one selected layer for the visible lines of a source, filters combined', () => {
    const layers = buildDirectionArrowLayers([
      entry(line('a', { filter: ['==', ['get', 'kind'], 'a'] })),
      entry(line('b', { filter: ['==', ['get', 'kind'], 'b'] })),
      entry(line('hidden', { layout: { visibility: 'none' } })),
      entry(line('hitarea', { paint: { 'line-opacity': 0, 'line-offset': 5 } })),
      entry({ id: 'fill', type: 'fill', source: 'src', paint: {} }),
    ])
    expect(layers.map((layer) => layer.paint?.['line-pattern'])).toEqual([
      'pattern-direction-arrow-faint',
      'pattern-direction-arrow-selected',
    ])
    const filter = layers[0]!.filter!
    expect(matches(filter, { kind: 'a' })).toBe(true)
    expect(matches(filter, { kind: 'b' })).toBe(true)
    expect(matches(filter, { kind: 'c' })).toBe(false)
  })

  test('faint arrows only once per data, selection arrows per source', () => {
    const layers = buildDirectionArrowLayers([
      entry(line('a')),
      entry(line('b', { source: 'src2' }), { sourceKey: 'src2' }),
    ])
    expect(layers.map((layer) => layer.source)).toEqual(['src', 'src', 'src2'])
    expect(layers.map((layer) => layer.paint?.['line-pattern'])).toEqual([
      'pattern-direction-arrow-faint',
      'pattern-direction-arrow-selected',
      'pattern-direction-arrow-selected',
    ])
  })

  test('arrows start no earlier than the selection minzoom and take the line offset', () => {
    const [, layer] = buildDirectionArrowLayers([
      entry(
        line('a', {
          minzoom: 9,
          paint: { 'line-offset': ['*', -1, ['coalesce', ['get', 'offset'], 0]] },
        }),
      ),
    ])
    expect(layer!.minzoom).toBe(DIRECTION_ARROWS_SELECTED_MINZOOM)
    expect(layer!.paint?.['line-offset']).toEqual(['*', -1, ['coalesce', ['get', 'offset'], 0]])
  })

  test('lines with another offset get their own layer, low-zoom-only lines none', () => {
    const layers = buildDirectionArrowLayers([
      entry(line('centered')),
      entry(line('shifted', { paint: { 'line-offset': 3 } })),
      entry(line('overview', { maxzoom: 12, paint: { 'line-offset': 7 } })),
    ])
    expect(layers.map((layer) => layer.paint?.['line-offset'])).toEqual([
      undefined,
      undefined,
      3,
      3,
    ])
  })

  test('reversed lines get their own layers with the reversed patterns', () => {
    const layers = buildDirectionArrowLayers([
      entry(line('forward')),
      entry(line('backward'), { reverseDirectionArrows: true }),
    ])
    expect(layers.map((layer) => layer.paint?.['line-pattern'])).toEqual([
      'pattern-direction-arrow-faint',
      'pattern-direction-arrow-selected',
      'pattern-direction-arrow-faint-reverse',
      'pattern-direction-arrow-selected-reverse',
    ])
  })
})
