import type {
  LegacyMapDataCategoryParam,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import {
  calculatorDatasetsForCategories,
  calculatorPartKey,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorDatasets.const'
import {
  compactCalculatorModeParam,
  type CalculatorModeParam,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorModeParam'

/**
 * The area calculator used to be switched on by a subcategory in the category list ("Summieren:
 * Öffentliches Straßenparken", …). It is the Summieren mode now
 * (`/summieren`, `?sum=`), and those subcategories are gone from the categories.
 *
 * `index` is where the subcategory sat in its category, which a `?config=` template depends on.
 * All of them had the one style `default` (checkbox). `sum` is the mode param that sums what the
 * subcategory summed; `undefined` when nothing does.
 */
const legacyCalculatorSubcategories = [
  {
    categoryId: 'parkingTilda',
    index: 7,
    subcategoryId: 'parkingTildaQuantized',
    // Public street parking, which is what the mode opens with.
    sum: {},
  },
  {
    categoryId: 'parkingTilda',
    index: 8,
    subcategoryId: 'parkingTildaQuantizedOffStreet',
    // Summed public and private together.
    sum: { filter: { [calculatorPartKey]: 'off_street' } },
  },
  // "Parkplätze zählen" of the community data: discontinued without a replacement (its tiles
  // are gone). Still listed because old `?config=` templates hold it; such links stay on the map.
  { categoryId: 'parkingLars', index: 1, subcategoryId: 'parkingPoints', sum: undefined },
] satisfies {
  categoryId: MapDataCategoryId
  index: number
  subcategoryId: string
  sum: CalculatorModeParam | undefined
}[]

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
 * An old `?config=` with a calculator subcategory on opens the Summieren mode with what it
 * summed. The subcategory itself is gone from the fresh config, so the merge drops it. `param`
 * is `undefined` for what the mode opens with anyway.
 */
export function calculatorModeFromLegacySubcategories(
  urlConfig: MapDataCategoryParam[],
  regionCategoryIds: MapDataCategoryId[],
) {
  if (calculatorDatasetsForCategories(regionCategoryIds).length === 0) return undefined

  // The old calculator took the first calculator subcategory that was on, in category order.
  for (const category of urlConfig) {
    for (const subcategory of category.subcategories) {
      // Old templates hold ids that are no longer part of the id types.
      const legacy = legacyCalculatorSubcategories.find(
        (l) => l.categoryId === category.id && l.subcategoryId === String(subcategory.id),
      )
      if (!legacy?.sum) continue
      if (!subcategory.styles.some((style) => style.active && style.id !== 'hidden')) continue

      return { param: compactCalculatorModeParam(legacy.sum) }
    }
  }
  return undefined
}
