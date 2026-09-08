import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { buildAtlasLayerEntries } from './buildAtlasLayerEntries'

const bikelanesConfig = () => createFreshCategoriesConfig(['bikelanes'])

const defaultArgs = {
  backgroundParam: 'default' as const,
  debugLayerStyles: false,
}

describe('buildAtlasLayerEntries', () => {
  test('undefined or empty dbLayerOrder keeps config order', () => {
    const categoriesConfig = bikelanesConfig()
    const withoutDb = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const withEmptyDb = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: [],
      ...defaultArgs,
    })

    expect(withoutDb.length).toBeGreaterThan(1)
    expect(withoutDb.map((e) => e.layerId)).toEqual(withEmptyDb.map((e) => e.layerId))
  })

  test('DB positions reorder entries bottom-first', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const first = configOrder[0]!.layerId
    const last = configOrder.at(-1)!.layerId
    expect(first).not.toBe(last)

    const reordered = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: [
        { layerKey: last, beforeId: null },
        { layerKey: first, beforeId: null },
      ],
      ...defaultArgs,
    })

    expect(reordered.map((e) => e.layerId)).toEqual([
      last,
      first,
      ...configOrder.map((e) => e.layerId).filter((id) => id !== last && id !== first),
    ])
  })

  test('DB beforeId override applies on the default background, not on a raster background', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const dbLayerOrder = [{ layerKey, beforeId: 'atlas-app-beforeid-below-roadname' as const }]

    const onDefault = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder,
      ...defaultArgs,
    })
    expect(onDefault[0]!.layerProps.beforeId).toBe('atlas-app-beforeid-below-roadname')

    const onRaster = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder,
      backgroundParam: 'esri',
      debugLayerStyles: false,
    })
    expect(onRaster[0]!.layerProps.beforeId).toBeUndefined()
  })

  test('unknown DB beforeId is ignored and the config/type default is used', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const defaultBeforeId = configOrder[0]!.layerProps.beforeId

    const withUnknown = buildAtlasLayerEntries({
      categoriesConfig,
      dbLayerOrder: [{ layerKey, beforeId: 'housenumber' }],
      ...defaultArgs,
    })
    expect(withUnknown[0]!.layerProps.beforeId).toBe(defaultBeforeId)
    expect(withUnknown[0]!.layerProps.beforeId).not.toBe('housenumber')
  })

  test('duplicate layerIds from the same subcategory in two categories are deduped, first wins', () => {
    const firstCategory = createFreshCategoriesConfig(['bikelanes'])
    const secondCategory = createFreshCategoriesConfig(['radinfra_bikelanes'])
    const bothCategories = createFreshCategoriesConfig(['bikelanes', 'radinfra_bikelanes'])

    const first = buildAtlasLayerEntries({
      categoriesConfig: firstCategory,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const second = buildAtlasLayerEntries({
      categoriesConfig: secondCategory,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const both = buildAtlasLayerEntries({
      categoriesConfig: bothCategories,
      dbLayerOrder: undefined,
      ...defaultArgs,
    })

    const firstIds = first.map((e) => e.layerId)
    const ids = both.map((e) => e.layerId)
    expect(ids).toEqual([...new Set(ids)])

    const firstIdSet = new Set(firstIds)
    const secondOnly = second.filter((e) => !firstIdSet.has(e.layerId))
    expect(both.length).toBe(first.length + secondOnly.length)
    expect(ids.slice(0, first.length)).toEqual(firstIds)
  })

  test('highlight ids are unique even when styles of one subcategory reuse raw layer ids', () => {
    // `roads` mounts several styles that all contain a layer "structure-icons".
    const entries = buildAtlasLayerEntries({
      categoriesConfig: createFreshCategoriesConfig(['roads']),
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    const highlightIds = entries.map((e) => e.highlightLayerId)
    expect(new Set(highlightIds).size).toBe(highlightIds.length)
    expect(highlightIds.every((id) => id.endsWith('--highlight'))).toBe(true)
    for (const entry of entries) {
      expect(entry.highlightLayerId).toBe(`${entry.layerId}--highlight`)
    }
  })

  test("layerProps.layout.visibility is 'none' for inactive categories", () => {
    const entries = buildAtlasLayerEntries({
      categoriesConfig: bikelanesConfig(),
      dbLayerOrder: undefined,
      ...defaultArgs,
    })
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.every((e) => e.layerProps.layout?.visibility === 'none')).toBe(true)
  })
})
