import { describe, expect, test } from 'vitest'
import { STACK_SLOT_IDS } from '@/components/admin/layerOrder/layerStack'
import { getAllAtlasLayerEntries } from './getAllAtlasLayerEntries'

describe('getAllAtlasLayerEntries', () => {
  const entries = getAllAtlasLayerEntries()

  test('lists every layer key once, in createLayerKeyAtlasGeo format', () => {
    const keys = entries.map((entry) => entry.layerKey)
    expect(keys.length).toBeGreaterThan(100)
    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(key, `malformed layer key: ${key}`).toMatch(
        /^source:.+--subcat:.+--style:.+--layer:.+$/,
      )
    }
  })

  test('a subcategory used by several categories lists all of them', () => {
    const shared = entries.find((entry) =>
      entry.layerKey.startsWith('source:atlas_bikeroutes--subcat:bikelanes_plus_routes--'),
    )
    expect(shared?.categoryNames.length).toBeGreaterThan(1)
  })

  // /admin/layer-order shows a layer at its default position; a position it does not know would
  // hide the layer there.
  test('every default beforeId is a position of the admin stack', () => {
    const unknown = entries.filter((entry) => !STACK_SLOT_IDS.includes(entry.defaultBeforeId))
    expect(unknown.map((entry) => `${entry.layerKey} → ${entry.defaultBeforeId}`)).toEqual([])
  })
})
