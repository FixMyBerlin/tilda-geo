import { describe, expect, test } from 'vitest'
import type { TildaLayerEntry } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllTildaLayerEntries'
import { LAYER_POSITIONS } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { moveToSlot, STACK_SLOT_IDS, toLayerStack, toSavedOrder } from './layerStack'

const TOP = 'atlas-app-beforeid-top'

const tildaLayer = (layerKey: string, defaultBeforeId: TildaLayerEntry['defaultBeforeId']) =>
  ({
    layerKey,
    defaultBeforeId,
    layerId: layerKey,
    layerType: 'line',
    categoryNames: [],
    subcategoryName: '',
    styleName: '',
  }) satisfies TildaLayerEntry

// Config order: a category with a line and a fill, then one with a fill, a line and a label that
// the config puts on top.
const tildaLayers = [
  tildaLayer('line-a', 'boundary_country'),
  tildaLayer('fill-a', 'landuse'),
  tildaLayer('fill-b', 'landuse'),
  tildaLayer('line-b', 'boundary_country'),
  tildaLayer('label', TOP),
]

// The table after the first sync: every layer of the code, in config order, no beforeId.
const codeOrder = (layers: TildaLayerEntry[]) =>
  layers.map((layer) => ({ layerKey: layer.layerKey, beforeId: null }))

describe('toLayerStack', () => {
  test('without a saved position, every layer is at its default one, the last of the config on top', () => {
    expect(toLayerStack(codeOrder(tildaLayers), tildaLayers)).toEqual({
      landuse: ['fill-b', 'fill-a'],
      boundary_country: ['line-b', 'line-a'],
      [TOP]: ['label'],
    })
  })

  test('a saved anchor is the position; the saved order is the order at a position', () => {
    const stack = toLayerStack(
      [
        { layerKey: 'line-b', beforeId: null },
        { layerKey: 'fill-a', beforeId: TOP },
        { layerKey: 'label', beforeId: null },
        { layerKey: 'line-a', beforeId: null },
        { layerKey: 'fill-b', beforeId: null },
      ],
      tildaLayers,
    )
    expect(stack).toEqual({
      landuse: ['fill-b'],
      boundary_country: ['line-a', 'line-b'],
      [TOP]: ['label', 'fill-a'],
    })
  })

  test('an anchor that left the basemap style is ignored', () => {
    const saved = codeOrder(tildaLayers).map((entry) =>
      entry.layerKey === 'fill-a' ? { ...entry, beforeId: 'atlas-app-beforeid-renamed' } : entry,
    )
    expect(toLayerStack(saved, tildaLayers).landuse).toEqual(['fill-b', 'fill-a'])
  })
})

describe('toSavedOrder', () => {
  test('lists the map from the bottom to the top and sets no beforeId without a change', () => {
    expect(toSavedOrder(toLayerStack(codeOrder(tildaLayers), tildaLayers), tildaLayers)).toEqual([
      { layerKey: 'fill-a', beforeId: null },
      { layerKey: 'fill-b', beforeId: null },
      { layerKey: 'line-a', beforeId: null },
      { layerKey: 'line-b', beforeId: null },
      { layerKey: 'label', beforeId: null },
    ])
  })

  test('a layer moved to a group below a basemap layer is saved with that layer as beforeId', () => {
    const stack = moveToSlot(
      toLayerStack(codeOrder(tildaLayers), tildaLayers),
      ['label'],
      'building',
    )
    const saved = toSavedOrder(stack, tildaLayers)
    expect(saved.find((entry) => entry.layerKey === 'label')).toEqual({
      layerKey: 'label',
      beforeId: 'building',
    })
    expect(toLayerStack(saved, tildaLayers).building).toEqual(['label'])
  })

  test('saving and loading again gives the same stack', () => {
    const stack = moveToSlot(toLayerStack(codeOrder(tildaLayers), tildaLayers), ['line-a'], TOP)
    expect(toLayerStack(toSavedOrder(stack, tildaLayers), tildaLayers)).toEqual({
      landuse: ['fill-b', 'fill-a'],
      boundary_country: ['line-b'],
      [TOP]: ['line-a', 'label'],
    })
  })
})

describe('moveToSlot', () => {
  test('puts the layer on top of the layers of the new position', () => {
    const stack = moveToSlot(toLayerStack(codeOrder(tildaLayers), tildaLayers), ['fill-a'], TOP)
    expect(stack[TOP]).toEqual(['fill-a', 'label'])
    expect(stack.landuse).toEqual(['fill-b'])
    expect(toSavedOrder(stack, tildaLayers).at(-1)).toEqual({ layerKey: 'fill-a', beforeId: TOP })
  })

  test('several layers move together and keep their order on the map', () => {
    const stack = moveToSlot(
      toLayerStack(codeOrder(tildaLayers), tildaLayers),
      ['fill-a', 'line-b', 'fill-b'],
      TOP,
    )
    // Lines are above fills, and fill-b is above fill-a.
    expect(stack[TOP]).toEqual(['line-b', 'fill-b', 'fill-a', 'label'])
    expect(stack.landuse).toEqual([])
    expect(stack.boundary_country).toEqual(['line-a'])
  })

  test('moving back to the default position removes the beforeId', () => {
    const moved = moveToSlot(toLayerStack(codeOrder(tildaLayers), tildaLayers), ['fill-a'], TOP)
    const saved = toSavedOrder(moveToSlot(moved, ['fill-a'], 'landuse'), tildaLayers)
    expect(saved.find((entry) => entry.layerKey === 'fill-a')?.beforeId).toBe(null)
  })
})

describe('a position that is the bottom of another one', () => {
  const GROUP1 = 'atlas-app-beforeid-group1'
  const layers = [tildaLayer('below-top', GROUP1), ...tildaLayers, tildaLayer('label-2', TOP)]

  test('its layers are listed at the bottom of that position', () => {
    const stack = toLayerStack(codeOrder(layers), layers)
    expect(stack[TOP]).toEqual(['label-2', 'label', 'below-top'])
    expect(stack[GROUP1]).toBeUndefined()
  })

  test('saving keeps the layer where the list shows it', () => {
    const saved = toSavedOrder(toLayerStack(codeOrder(layers), layers), layers)
    const top = saved.filter(
      (entry) => entry.beforeId === TOP || entry.layerKey.startsWith('label'),
    )
    expect(top).toEqual([
      { layerKey: 'below-top', beforeId: TOP },
      { layerKey: 'label', beforeId: null },
      { layerKey: 'label-2', beforeId: null },
    ])
    expect(toLayerStack(saved, layers)[TOP]).toEqual(['label-2', 'label', 'below-top'])
  })
})

describe('STACK', () => {
  test('lists the positions of the map, top first', () => {
    expect(STACK_SLOT_IDS).toEqual([...LAYER_POSITIONS].reverse())
  })
})
