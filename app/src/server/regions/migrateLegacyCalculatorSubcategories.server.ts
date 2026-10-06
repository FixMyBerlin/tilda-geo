import type {
  LegacyMapDataCategoryParam,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { calculatorDatasetsForCategories } from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorDatasets.const'
import {
  compactCalculatorModeParam,
  type CalculatorModeParam,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorModeParam'

/**
 * The area calculator used to be switched on by a subcategory in the category list ("Summieren:
 * Öffentliches Straßenparken", "Parkplätze zählen", …). It is the Summieren mode now
 * (`/summieren`, `?sum=`), and those subcategories are gone from the categories.
 *
 * `index` is where the subcategory sat in its category, which a `?config=` template depends on.
 * All of them had the one style `default` (checkbox).
 */
const legacyCalculatorSubcategories = [
  {
    categoryId: 'parkingTilda',
    index: 7,
    subcategoryId: 'parkingTildaQuantized',
    dataset: 'tilda_parkings_quantized',
  },
  {
    categoryId: 'parkingTilda',
    index: 8,
    subcategoryId: 'parkingTildaQuantizedOffStreet',
    dataset: 'tilda_parkings_off_street_quantized',
  },
  {
    categoryId: 'parkingLars',
    index: 1,
    subcategoryId: 'parkingPoints',
    dataset: 'lars_parking_points',
  },
] as const

/**
 * The template that `?config=` links were encoded with right before the subcategories were
 * removed. That was a code change, so no region save stored it in `RegionConfigTemplate`.
 * `undefined` when the region has none of the categories.
 *
 * Only exact while the two categories keep their other subcategories as they are; after a later
 * change this template matches no checksum anymore and old links fall back to the stored templates.
 */
export function templateWithLegacyCalculatorSubcategories(template: MapDataCategoryParam[]) {
  if (
    !legacyCalculatorSubcategories.some((legacy) =>
      template.some((c) => c.id === legacy.categoryId),
    )
  ) {
    return undefined
  }

  return template.map((category) => {
    const subcategories: LegacyMapDataCategoryParam['subcategories'] = [...category.subcategories]
    for (const legacy of legacyCalculatorSubcategories) {
      if (legacy.categoryId !== category.id) continue
      subcategories.splice(legacy.index, 0, {
        id: legacy.subcategoryId,
        styles: [{ id: 'default', active: false }],
      })
    }
    return { ...category, subcategories }
  }) satisfies LegacyMapDataCategoryParam[]
}

/**
 * An old `?config=` with a calculator subcategory on opens the Summieren mode with that dataset.
 * The subcategory itself is gone from the fresh config, so the merge drops it. `param` is
 * `undefined` for the region's default dataset.
 */
export function calculatorModeFromLegacySubcategories(
  urlConfig: MapDataCategoryParam[],
  regionCategoryIds: MapDataCategoryId[],
) {
  const regionDatasets = calculatorDatasetsForCategories(regionCategoryIds)

  // The old calculator took the first calculator subcategory that was on, in category order.
  for (const category of urlConfig) {
    for (const subcategory of category.subcategories) {
      // Old templates hold ids that are no longer part of the id types.
      const legacy = legacyCalculatorSubcategories.find(
        (l) => l.categoryId === category.id && l.subcategoryId === String(subcategory.id),
      )
      if (!legacy) continue
      if (!subcategory.styles.some((style) => style.active && style.id !== 'hidden')) continue
      if (!regionDatasets.some((dataset) => dataset.sourceId === legacy.dataset)) continue

      const param: CalculatorModeParam = {
        key: legacy.dataset === regionDatasets[0]?.sourceId ? undefined : legacy.dataset,
      }
      return { param: compactCalculatorModeParam(param) }
    }
  }
  return undefined
}
