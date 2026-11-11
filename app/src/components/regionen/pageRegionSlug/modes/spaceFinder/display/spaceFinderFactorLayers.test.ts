import { produce } from 'immer'
import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '../../../hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import type { MapDataCategoryConfig } from '../../../hooks/useQueryState/useCategoriesConfig/type'
import {
  activateSpaceFinderFactorLayers,
  spaceFinderWantedFactorLayers,
} from './spaceFinderFactorLayers'

const freshConfig = () => createFreshCategoriesConfig(['poi', 'bicycleParking'])

const flags = (categoriesConfig: MapDataCategoryConfig[]) =>
  categoriesConfig.map((category) => ({
    id: category.id,
    active: category.active,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      styles: subcategory.styles.map((style) => ({ id: style.id, active: style.active })),
    })),
  }))

const isSubcategoryOn = (categoriesConfig: MapDataCategoryConfig[], key: string) => {
  const [categoryId, subcategoryId] = key.split('/')
  const subcategory = categoriesConfig
    .find((category) => category.id === categoryId)
    ?.subcategories.find((item) => item.id === subcategoryId)
  return subcategory?.styles.some((style) => style.id !== 'hidden' && style.active) ?? false
}

const isCategoryActive = (categoriesConfig: MapDataCategoryConfig[], categoryId: string) =>
  categoriesConfig.find((category) => category.id === categoryId)?.active ?? false

describe('spaceFinderWantedFactorLayers', () => {
  test('ignores zero weights, merges duplicates and sorts', () => {
    expect(spaceFinderWantedFactorLayers({ w_target: 0 })).toEqual([])

    const keys = spaceFinderWantedFactorLayers({ w_transit: 3, w_target: 0, w_bestand: 1 })
    expect(keys).toEqual([
      'bicycleParking/bicycleParking',
      'poi/poiPlusPublicTransport',
      'radinfra_bicycleParking/radinfraBicycleParking',
    ])
  })
})

describe('activateSpaceFinderFactorLayers', () => {
  test('switches on the category and a non-hidden style of the subcategory', () => {
    const result = activateSpaceFinderFactorLayers({
      categoriesConfig: freshConfig(),
      wanted: ['poi/poiPlusPublicTransport'],
    })

    expect(result.changed).toBe(true)
    expect(isCategoryActive(result.categoriesConfig, 'poi')).toBe(true)
    expect(isSubcategoryOn(result.categoriesConfig, 'poi/poiPlusPublicTransport')).toBe(true)
  })

  test('skips a category the region does not have', () => {
    const categoriesConfig = freshConfig()
    const result = activateSpaceFinderFactorLayers({
      categoriesConfig,
      wanted: ['bikelanes/bikelanes'],
    })

    expect(result.changed).toBe(false)
    expect(flags(result.categoriesConfig)).toEqual(flags(categoriesConfig))
  })

  test('leaves everything that was on untouched and reports no change when all is on', () => {
    const first = activateSpaceFinderFactorLayers({
      categoriesConfig: freshConfig(),
      wanted: ['poi/poiPlusPublicTransport', 'bicycleParking/bicycleParking'],
    })
    const withOtherStyle = produce(first.categoriesConfig, (draft) => {
      const subcategory = draft
        .find((category) => category.id === 'poi')
        ?.subcategories.find((item) => item.id === 'poi')
      const otherStyle = subcategory?.styles.find(
        (style) => style.id !== 'hidden' && style.id !== 'default',
      )
      if (subcategory && otherStyle) {
        for (const style of subcategory.styles) style.active = false
        otherStyle.active = true
      }
    })

    const second = activateSpaceFinderFactorLayers({
      categoriesConfig: withOtherStyle,
      wanted: ['poi/poi', 'poi/poiPlusPublicTransport'],
    })

    expect(second.changed).toBe(false)
    expect(flags(second.categoriesConfig)).toEqual(flags(withOtherStyle))
  })

  test('does not switch off layers that are not wanted', () => {
    const first = activateSpaceFinderFactorLayers({
      categoriesConfig: freshConfig(),
      wanted: ['poi/poiPlusPublicTransport'],
    })
    const second = activateSpaceFinderFactorLayers({
      categoriesConfig: first.categoriesConfig,
      wanted: [],
    })

    expect(second.changed).toBe(false)
    expect(isSubcategoryOn(second.categoriesConfig, 'poi/poiPlusPublicTransport')).toBe(true)
  })
})
