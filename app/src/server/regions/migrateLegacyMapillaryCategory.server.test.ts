import { describe, expect, test } from 'vitest'
import type {
  LegacyMapDataCategoryParam,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { streetImageryFromLegacyMapillaryCategory } from './migrateLegacyMapillaryCategory.server'

// As decoded from an old `?config=`: ids that no longer exist in the id types.
const legacyConfig = (categoryId: string, active: boolean, activeStyle: string) => {
  const config: LegacyMapDataCategoryParam[] = [
    { id: 'roads', active: true, subcategories: [] },
    {
      id: categoryId,
      active,
      subcategories: [
        {
          id: 'mapillaryCoverage',
          styles: ['hidden', 'default', 'all', 'age', 'pano'].map((id) => ({
            id,
            active: id === activeStyle,
          })),
        },
      ],
    },
  ]
  return config as MapDataCategoryParam[]
}

describe('streetImageryFromLegacyMapillaryCategory()', () => {
  test('category on with the default style: Mapillary with the defaults', () => {
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('mapillary', true, 'default')),
    ).toEqual({ providers: ['mapillary'] })
  })

  test('the radinfra category counts as well', () => {
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('radinfra_mapillary', true, 'pano')),
    ).toEqual({ providers: ['mapillary'] })
  })

  test('style "age" keeps the colours by age, "all" removes the date limit', () => {
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('mapillary', true, 'age')),
    ).toEqual({ providers: ['mapillary'], style: 'age' })
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('mapillary', true, 'all')),
    ).toEqual({ providers: ['mapillary'], date: {} })
  })

  test('category off, or its photos hidden: street imagery stays off', () => {
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('mapillary', false, 'default')),
    ).toBeUndefined()
    expect(
      streetImageryFromLegacyMapillaryCategory(legacyConfig('mapillary', true, 'hidden')),
    ).toBeUndefined()
  })

  test('no Mapillary category in the config', () => {
    expect(
      streetImageryFromLegacyMapillaryCategory([{ id: 'roads', active: true, subcategories: [] }]),
    ).toBeUndefined()
  })
})
