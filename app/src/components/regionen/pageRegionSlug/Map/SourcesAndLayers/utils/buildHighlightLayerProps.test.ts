import type { LayerProps } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import { buildHighlightLayerProps } from './buildHighlightLayerProps'

const sourceFields = {
  source: 'atlas_bikelanes',
  'source-layer': 'bikelanes',
  beforeId: 'atlas-app-beforeid-top',
} as const

describe('buildHighlightLayerProps', () => {
  test("line keeps layout.visibility 'none', sets highlight color/opacity, and removes line-blur", () => {
    const result = buildHighlightLayerProps({
      id: 'line_base',
      type: 'line',
      ...sourceFields,
      layout: { visibility: 'none' },
      paint: { 'line-color': '#174ed9', 'line-blur': 2, 'line-width': 3 },
    } satisfies LayerProps)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('line')
    expect(result && 'layout' in result && result.layout).toMatchObject({ visibility: 'none' })
    expect(result && 'paint' in result && result.paint).toMatchObject({
      'line-width': 3,
      'line-color': expect.arrayContaining(['case']),
      'line-opacity': expect.arrayContaining(['case']),
    })
    expect(result && 'paint' in result && result.paint).not.toHaveProperty('line-blur')
  })

  test("fill becomes type 'line' and preserves layout.visibility 'none'", () => {
    const result = buildHighlightLayerProps({
      id: 'fill_base',
      type: 'fill',
      ...sourceFields,
      layout: { visibility: 'none' },
      paint: { 'fill-color': '#174ed9' },
    } satisfies LayerProps)

    expect(result?.type).toBe('line')
    expect(result && 'layout' in result && result.layout).toMatchObject({ visibility: 'none' })
  })

  test("symbol without symbol-placement becomes type 'circle' with visibility preserved", () => {
    const result = buildHighlightLayerProps({
      id: 'symbol_icon',
      type: 'symbol',
      ...sourceFields,
      layout: { visibility: 'none' },
    } satisfies LayerProps)

    expect(result?.type).toBe('circle')
    expect(result && 'layout' in result && result.layout).toMatchObject({ visibility: 'none' })
  })

  test('symbol with symbol-placement returns null', () => {
    const result = buildHighlightLayerProps({
      id: 'symbol_along_line',
      type: 'symbol',
      ...sourceFields,
      layout: { visibility: 'none', 'symbol-placement': 'line' },
    } satisfies LayerProps)

    expect(result).toBeNull()
  })

  test('heatmap returns null', () => {
    const result = buildHighlightLayerProps({
      id: 'heatmap_base',
      type: 'heatmap',
      ...sourceFields,
    } satisfies LayerProps)

    expect(result).toBeNull()
  })

  test('beforeId, source, and source-layer are passed through unchanged', () => {
    const result = buildHighlightLayerProps({
      id: 'line_base',
      type: 'line',
      ...sourceFields,
      layout: { visibility: 'visible' },
    } satisfies LayerProps)

    expect(result).toMatchObject({
      source: 'atlas_bikelanes',
      'source-layer': 'bikelanes',
      beforeId: 'atlas-app-beforeid-top',
    })
  })
})
