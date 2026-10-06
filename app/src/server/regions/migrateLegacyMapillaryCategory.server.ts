import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import type { StreetImageryParam } from '@/components/regionen/pageRegionSlug/streetImagery/streetImageryParam'

const legacyCategoryIds = ['mapillary', 'radinfra_mapillary']
const legacySubcategoryId = 'mapillaryCoverage'

/**
 * Mapillary used to be a category (`mapillary`, `radinfra_mapillary`); now street imagery is
 * `?photos=`. An old `?config=` with the category on and its photos shown turns Mapillary on
 * there. The category itself is gone from the fresh config, so the merge drops it.
 *
 * Old styles: `default` (last 2 years, the new default), `all`, `age`, `pano` (only 360°; there
 * is no such filter anymore, so it becomes the default).
 */
export function streetImageryFromLegacyMapillaryCategory(urlConfig: MapDataCategoryParam[]) {
  // Old templates hold ids that are no longer part of the id types.
  const category = urlConfig.find(({ id, active }) => active && legacyCategoryIds.includes(id))
  const subcategory = category?.subcategories.find(({ id }) => String(id) === legacySubcategoryId)
  const style = subcategory?.styles.find(({ active }) => active)
  if (!style || style.id === 'hidden') return undefined

  const styleId = String(style.id)
  return {
    providers: ['mapillary'],
    style: styleId === 'age' ? 'age' : undefined,
    date: styleId === 'all' ? {} : undefined,
  } satisfies StreetImageryParam
}
