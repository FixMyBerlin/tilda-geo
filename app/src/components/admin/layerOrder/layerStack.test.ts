import { describe, expect, test } from 'vitest'
import type { AtlasLayerEntry } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import { layersAt, moveToSlot, reorderSlot, toLayerOrder, toSavedOrder } from './layerStack'

const TOP = 'atlas-app-beforeid-top'

const atlasLayer = (layerKey: string, defaultBeforeId: AtlasLayerEntry['defaultBeforeId']) =>
  ({
    layerKey,
    defaultBeforeId,
    layerId: layerKey,
    layerType: 'line',
    categoryNames: [],
    subcategoryName: '',
    styleName: '',
  }) satisfies AtlasLayerEntry

// Config order: a category with a line and a fill, then one with a fill, a line and a label that
// the config puts on top.
const atlasLayers = [
  atlasLayer('line-a', 'boundary_country'),
  atlasLayer('fill-a', 'landuse'),
  atlasLayer('fill-b', 'landuse'),
  atlasLayer('line-b', 'boundary_country'),
  atlasLayer('label', TOP),
]
const keys = (order: { layerKey: string }[]) => order.map((entry) => entry.layerKey)

describe('toLayerOrder', () => {
  test('nothing saved: the config order, every layer at its default position', () => {
    const order = toLayerOrder([], atlasLayers)
    expect(keys(order)).toEqual(['line-a', 'fill-a', 'fill-b', 'line-b', 'label'])
    expect(layersAt(order, 'landuse')).toEqual(['fill-b', 'fill-a'])
    expect(layersAt(order, 'boundary_country')).toEqual(['line-b', 'line-a'])
    expect(layersAt(order, TOP)).toEqual(['label'])
  })

  test('a saved anchor is the position; a layer that is new in the code is on top', () => {
    const order = toLayerOrder(
      [
        { layerKey: 'line-b', beforeId: null },
        { layerKey: 'fill-a', beforeId: TOP },
        { layerKey: 'label', beforeId: null },
      ],
      atlasLayers,
    )
    expect(keys(order)).toEqual(['line-b', 'fill-a', 'label', 'line-a', 'fill-b'])
    expect(layersAt(order, TOP)).toEqual(['label', 'fill-a'])
    expect(layersAt(order, 'boundary_country')).toEqual(['line-a', 'line-b'])
  })

  test('a saved layer that left the code, or an anchor that left the style, is ignored', () => {
    const order = toLayerOrder(
      [
        { layerKey: 'gone', beforeId: TOP },
        { layerKey: 'fill-a', beforeId: 'atlas-app-beforeid-renamed' },
      ],
      atlasLayers,
    )
    expect(keys(order)).not.toContain('gone')
    expect(layersAt(order, 'landuse')).toEqual(['fill-b', 'fill-a'])
  })
})

describe('toSavedOrder', () => {
  test('saving without a change keeps the config order and sets no beforeId', () => {
    expect(toSavedOrder(toLayerOrder([], atlasLayers), atlasLayers)).toEqual(
      atlasLayers.map((layer) => ({ layerKey: layer.layerKey, beforeId: null })),
    )
  })

  test('saving and loading again gives the same order', () => {
    const order = moveToSlot(toLayerOrder([], atlasLayers), 'line-a', TOP)
    expect(toLayerOrder(toSavedOrder(order, atlasLayers), atlasLayers)).toEqual(order)
  })
})

describe('reorderSlot', () => {
  test('sorts the layers of one position and leaves all others where they are', () => {
    const order = reorderSlot(toLayerOrder([], atlasLayers), 'landuse', ['fill-a', 'fill-b'])
    expect(keys(order)).toEqual(['line-a', 'fill-b', 'fill-a', 'line-b', 'label'])
  })
})

describe('moveToSlot', () => {
  test('puts the layer on top of the layers of the new position', () => {
    const order = moveToSlot(toLayerOrder([], atlasLayers), 'fill-a', TOP)
    expect(keys(order)).toEqual(['line-a', 'fill-b', 'line-b', 'label', 'fill-a'])
    expect(toSavedOrder(order, atlasLayers).at(-1)).toEqual({ layerKey: 'fill-a', beforeId: TOP })
  })

  test('a layer that moves to an empty position keeps its place in the list', () => {
    const order = moveToSlot(toLayerOrder([], atlasLayers), 'fill-a', 'atlas-app-beforeid-group2')
    expect(keys(order)).toEqual(keys(toLayerOrder([], atlasLayers)))
    expect(layersAt(order, 'atlas-app-beforeid-group2')).toEqual(['fill-a'])
  })

  test('moving back to the default position removes the beforeId', () => {
    const moved = moveToSlot(toLayerOrder([], atlasLayers), 'fill-a', TOP)
    const saved = toSavedOrder(moveToSlot(moved, 'fill-a', 'landuse'), atlasLayers)
    expect(saved.find((entry) => entry.layerKey === 'fill-a')?.beforeId).toBe(null)
  })
})
