import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { buildAtlasLayerEntries } from './buildAtlasLayerEntries'

const bikelanesConfig = () => createFreshCategoriesConfig(['bikelanes'])

const defaultArgs = {
  backgroundParam: 'default' as const,
  debugLayerStyles: false,
}

describe('buildAtlasLayerEntries', () => {
  test('DB positions reorder entries bottom-first', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: [],
      ...defaultArgs,
    })
    const first = configOrder[0]!.layerId
    const last = configOrder.at(-1)!.layerId
    expect(first).not.toBe(last)

    const reordered = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: [
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
      layerOrder: [],
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const layerOrder = [{ layerKey, beforeId: 'atlas-app-beforeid-below-roadname' as const }]

    const onDefault = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder,
      ...defaultArgs,
    })
    expect(onDefault[0]!.layerProps.beforeId).toBe('atlas-app-beforeid-below-roadname')

    const onRaster = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder,
      backgroundParam: 'esri',
      debugLayerStyles: false,
    })
    expect(onRaster[0]!.layerProps.beforeId).toBeUndefined()
  })

  test('unknown DB beforeId is ignored and the config/type default is used', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: [],
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const defaultBeforeId = configOrder[0]!.layerProps.beforeId

    const withUnknown = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: [{ layerKey, beforeId: 'housenumber' }],
      ...defaultArgs,
    })
    expect(withUnknown[0]!.layerProps.beforeId).toBe(defaultBeforeId)
    expect(withUnknown[0]!.layerProps.beforeId).not.toBe('housenumber')
  })

  test('a subcategory in two categories mounts its layers once, at the first position', () => {
    const firstCategory = createFreshCategoriesConfig(['bikelanes'])
    const secondCategory = createFreshCategoriesConfig(['radinfra_bikelanes'])
    const bothCategories = createFreshCategoriesConfig(['bikelanes', 'radinfra_bikelanes'])

    const first = buildAtlasLayerEntries({
      categoriesConfig: firstCategory,
      layerOrder: [],
      ...defaultArgs,
    })
    const second = buildAtlasLayerEntries({
      categoriesConfig: secondCategory,
      layerOrder: [],
      ...defaultArgs,
    })
    const both = buildAtlasLayerEntries({
      categoriesConfig: bothCategories,
      layerOrder: [],
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

  test('a layer shared by two categories is visible when either category shows it', () => {
    const routesVisibility = (shownIn: 'bikelanes' | 'radinfra_bikelanes' | null) => {
      const categoriesConfig = createFreshCategoriesConfig(['bikelanes', 'radinfra_bikelanes'])
      for (const category of categoriesConfig) {
        category.active = true
        const routes = category.subcategories.find((s) => s.id === 'bikelanes_plus_routes')
        for (const style of routes?.styles ?? []) {
          style.active = style.id === 'default' && category.id === shownIn
        }
      }
      const entries = buildAtlasLayerEntries({ categoriesConfig, layerOrder: [], ...defaultArgs })
      const routesEntries = entries.filter((entry) =>
        entry.layerId.includes('--subcat:bikelanes_plus_routes--style:default--'),
      )
      expect(routesEntries.length).toBeGreaterThan(0)
      return new Set(routesEntries.map((entry) => entry.layerProps.layout?.visibility))
    }

    expect(routesVisibility(null)).toEqual(new Set(['none']))
    expect(routesVisibility('bikelanes')).toEqual(new Set(['visible']))
    expect(routesVisibility('radinfra_bikelanes')).toEqual(new Set(['visible']))
  })

  test('highlight ids are unique even when styles of one subcategory reuse raw layer ids', () => {
    // `roads` mounts several styles that all contain a layer "structure-icons".
    const entries = buildAtlasLayerEntries({
      categoriesConfig: createFreshCategoriesConfig(['roads']),
      layerOrder: [],
      ...defaultArgs,
    })
    const highlightIds = entries.map((e) => e.highlightLayerId)
    expect(new Set(highlightIds).size).toBe(highlightIds.length)
    expect(highlightIds.every((id) => id.endsWith('--highlight'))).toBe(true)
    for (const entry of entries) {
      expect(entry.highlightLayerId).toBe(`${entry.layerId}--highlight`)
    }
  })
})
