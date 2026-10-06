import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import type {
  MapDataCategoryConfig,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { simplifyConfigForParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { calcConfigChecksum } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/lib'
import { parse } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/parse'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import {
  calculatorModeFromLegacySubcategories,
  templateWithLegacyCalculatorSubcategories,
} from './migrateLegacyCalculatorSubcategories.server'

const legacyTemplate = (categories: MapDataCategoryId[]) =>
  templateWithLegacyCalculatorSubcategories(
    simplifyConfigForParams(createFreshCategoriesConfig(categories)),
  )

const decode = (config: string, categories: MapDataCategoryId[]) =>
  parse(config, legacyTemplate(categories) as MapDataCategoryConfig[]) as MapDataCategoryParam[]

describe('templateWithLegacyCalculatorSubcategories()', () => {
  // Checksums of the fresh config right before the subcategories were removed (develop a6be8269e).
  test.each([
    [['parkingTilda'], '1649tc'],
    [['parkingTilda', 'roads'], 'dgp49i'],
    [['parkingTilda', 'parkingLars'], 'usbee5'],
    [['parkingLars'], '7yzzp6'],
    [['bikelanes', 'parkingLars', 'poi'], 'shaxr3'],
  ] as [MapDataCategoryId[], string][])(
    '%j has the checksum of old links',
    (categories, checksum) => {
      const template = legacyTemplate(categories)
      expect(calcConfigChecksum(template as MapDataCategoryConfig[])).toBe(checksum)
    },
  )

  test('no template for a region without the categories', () => {
    expect(legacyTemplate(['bikelanes', 'roads'])).toBeUndefined()
  })
})

describe('calculatorModeFromLegacySubcategories()', () => {
  const both: MapDataCategoryId[] = ['parkingTilda', 'parkingLars']

  test('nothing on → no mode', () => {
    expect(
      calculatorModeFromLegacySubcategories(decode('usbee5.i19t0k.6pw', both), both),
    ).toBeUndefined()
  })

  test('street parking is the default dataset of the region', () => {
    expect(calculatorModeFromLegacySubcategories(decode('usbee5.i1wa3p.6pw', both), both)).toEqual({
      param: undefined,
    })
  })

  test('other datasets are named', () => {
    expect(calculatorModeFromLegacySubcategories(decode('usbee5.i2ir6t.6pw', both), both)).toEqual({
      param: { key: 'tilda_parkings_off_street_quantized' },
    })
    expect(calculatorModeFromLegacySubcategories(decode('usbee5.mjl7hg.6pw', both), both)).toEqual({
      param: { key: 'lars_parking_points' },
    })
  })

  test('a dataset the region no longer has is ignored', () => {
    expect(
      calculatorModeFromLegacySubcategories(decode('usbee5.mjl7hg.6pw', both), ['parkingTilda']),
    ).toBeUndefined()
  })
})
