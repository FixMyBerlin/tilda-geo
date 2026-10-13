import { describe, expect, test } from 'vitest'
import { planMapLayerOrderSync } from './syncMapLayerOrder'

describe('planMapLayerOrderSync', () => {
  test('an empty table gets every layer, in the order of the code', () => {
    expect(planMapLayerOrderSync([], ['a', 'b'])).toEqual({
      add: [
        { layerKey: 'a', position: 0, beforeId: null },
        { layerKey: 'b', position: 1, beforeId: null },
      ],
      remove: [],
    })
  })

  test('a complete table needs nothing', () => {
    const rows = [
      { layerKey: 'b', position: 0 },
      { layerKey: 'a', position: 1 },
    ]
    expect(planMapLayerOrderSync(rows, ['a', 'b'])).toEqual({ add: [], remove: [] })
  })

  test('a new layer goes after all rows; a layer that left the code is removed', () => {
    const rows = [
      { layerKey: 'gone', position: 3 },
      { layerKey: 'a', position: 7 },
    ]
    expect(planMapLayerOrderSync(rows, ['new', 'a'])).toEqual({
      add: [{ layerKey: 'new', position: 8, beforeId: null }],
      remove: ['gone'],
    })
  })
})
