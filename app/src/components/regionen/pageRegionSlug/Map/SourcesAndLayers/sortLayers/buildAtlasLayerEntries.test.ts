import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { layerPositionRank } from '../utils/beforeId'
import { buildAtlasLayerEntries } from './buildAtlasLayerEntries'
import { getAllAtlasLayerEntries } from './getAllAtlasLayerEntries'

// The table after the first sync: every layer of the code, in config order, no beforeId.
const codeOrder = getAllAtlasLayerEntries().map((layer) => ({
  layerKey: layer.layerKey,
  beforeId: null,
}))

const bikelanesConfig = () => createFreshCategoriesConfig(['bikelanes'])

const defaultArgs = {
  backgroundParam: 'default' as const,
  debugLayerStyles: false,
}

describe('buildAtlasLayerEntries', () => {
  test('the saved order sorts the layers of one position, lower layer first', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: codeOrder,
      ...defaultArgs,
    })
    const samePosition = configOrder.filter((e) => e.position === configOrder[0]!.position)
    const first = samePosition[0]!.layerId
    const last = samePosition.at(-1)!.layerId
    expect(first).not.toBe(last)

    const ids = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: [
        ...codeOrder.filter((entry) => entry.layerKey === last),
        ...codeOrder.filter((entry) => entry.layerKey !== last),
      ],
      ...defaultArgs,
    }).map((e) => e.layerId)

    expect(ids.slice(0, 2)).toEqual([last, first])
  })

  test('a layer without an entry in the saved order is an error', () => {
    expect(() =>
      buildAtlasLayerEntries({
        categoriesConfig: bikelanesConfig(),
        layerOrder: [],
        ...defaultArgs,
      }),
    ).toThrow(/no entry for layer/)
  })

  test('layers of a lower position mount first, on every background', () => {
    const categoriesConfig = createFreshCategoriesConfig(['bikelanes', 'surface', 'poi'])
    for (const backgroundParam of ['default', 'esri']) {
      const entries = buildAtlasLayerEntries({
        categoriesConfig,
        layerOrder: codeOrder,
        backgroundParam,
        debugLayerStyles: false,
      })
      const ranks = entries.map((e) => layerPositionRank(e.position))
      expect(new Set(ranks).size).toBeGreaterThan(2)
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    }
  })

  test('a saved beforeId is the position of the layer', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: codeOrder,
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const layerOrder = codeOrder.map((entry) =>
      entry.layerKey === layerKey ? { ...entry, beforeId: 'atlas-app-beforeid-group2' } : entry,
    )

    const onDefault = buildAtlasLayerEntries({ categoriesConfig, layerOrder, ...defaultArgs })
    const moved = onDefault.find((e) => e.layerId === layerKey)
    expect(moved?.position).toBe('atlas-app-beforeid-group2')
    expect(moved?.layerProps.beforeId).toBe('atlas-app-beforeid-group2')
  })

  test('a saved beforeId that is not a layer of the basemap is ignored', () => {
    const categoriesConfig = bikelanesConfig()
    const configOrder = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: codeOrder,
      ...defaultArgs,
    })
    const layerKey = configOrder[0]!.layerId
    const defaultBeforeId = configOrder[0]!.layerProps.beforeId

    const withUnknown = buildAtlasLayerEntries({
      categoriesConfig,
      layerOrder: codeOrder.map((entry) =>
        entry.layerKey === layerKey ? { ...entry, beforeId: 'atlas-app-beforeid-renamed' } : entry,
      ),
      ...defaultArgs,
    })
    const layer = withUnknown.find((e) => e.layerId === layerKey)
    expect(layer?.layerProps.beforeId).toBe(defaultBeforeId)
  })

  test('a subcategory in two categories mounts its layers once, at the first position', () => {
    const firstCategory = createFreshCategoriesConfig(['bikelanes'])
    const secondCategory = createFreshCategoriesConfig(['radinfra_bikelanes'])
    const bothCategories = createFreshCategoriesConfig(['bikelanes', 'radinfra_bikelanes'])

    const first = buildAtlasLayerEntries({
      categoriesConfig: firstCategory,
      layerOrder: codeOrder,
      ...defaultArgs,
    })
    const second = buildAtlasLayerEntries({
      categoriesConfig: secondCategory,
      layerOrder: codeOrder,
      ...defaultArgs,
    })
    const both = buildAtlasLayerEntries({
      categoriesConfig: bothCategories,
      layerOrder: codeOrder,
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
      const entries = buildAtlasLayerEntries({
        categoriesConfig,
        layerOrder: codeOrder,
        ...defaultArgs,
      })
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
      layerOrder: codeOrder,
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
