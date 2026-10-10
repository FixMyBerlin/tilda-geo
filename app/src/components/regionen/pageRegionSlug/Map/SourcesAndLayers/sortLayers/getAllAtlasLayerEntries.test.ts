import { describe, expect, test } from 'vitest'
import { categories } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/categories.const'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { layerPosition } from '../utils/beforeId'
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

  // The layer key has no category id: the same key has to be the same layer at the same position.
  test('a layer key that several subcategories share has one position', () => {
    const positions = new Map<string, Set<string>>()
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        for (const style of subcategory.styles) {
          for (const layer of style.layers ?? []) {
            const key = createLayerKeyAtlasGeo(
              getSourceData(subcategory.sourceId).id,
              subcategory.id,
              style.id,
              layer.id,
            )
            const position = layerPosition({ layer, subcategoryBeforeId: subcategory.beforeId })
            positions.set(key, (positions.get(key) ?? new Set()).add(position))
          }
        }
      }
    }
    const clashes = [...positions].filter(([, set]) => set.size > 1)
    expect(clashes.map(([key, set]) => `${key} → ${[...set].join(' / ')}`)).toEqual([])
  })
})
