import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import {
  compactCalculatorModeParam,
  parseCalculatorModeParam,
} from '@/components/regionen/pageRegionSlug/modes/calculator/calculatorModeParam'
import { calculatorModeFromLegacySubcategories } from '@/server/regions/migrateLegacyCalculatorSubcategories.server'
import { streetImageryFromLegacyMapillaryCategory } from '@/server/regions/migrateLegacyMapillaryCategory.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

/**
 * Links from this URL version (`v`) on no longer hold the entries below, so
 * `getRegionRedirectUrl` skips this step for them (`migrations/0004_calculator_mode.ts`).
 */
export const REMOVED_CONFIG_ENTRIES_URL_VERSION = 4

type Context = {
  regionRootPath: string
  region: Pick<TRegion, 'categories'>
}

/**
 * Some things were once switched on in `?config=` and are their own feature now. Reads what
 * the decoded config of an old link had on and writes it to `url` where it lives today. The
 * entries themselves are gone from the fresh config, so the merge that follows drops them.
 *
 * A value that is already set wins over the old config.
 */
export function migrateRemovedConfigEntries(
  url: URL,
  urlConfig: MapDataCategoryParam[],
  { regionRootPath, region }: Context,
) {
  // Mapillary category → street imagery (`photos`).
  const streetImagery = streetImageryFromLegacyMapillaryCategory(urlConfig)
  if (streetImagery && !url.searchParams.has(searchParamsRegistry.photos)) {
    url.searchParams.set(searchParamsRegistry.photos, JSON.stringify(streetImagery))
  }

  // Calculator subcategories ("Summieren: …") → Summieren mode (`/summieren`, `sum`). Only a
  // link to the map opens the mode; a link to another mode stays there.
  const calculatorMode = calculatorModeFromLegacySubcategories(urlConfig, region.categories)
  if (calculatorMode) {
    if (url.pathname === regionRootPath) url.pathname = `${regionRootPath}/summieren`
    // `sum` may already hold the drawn areas of the link (`migrations/0004_calculator_mode.ts`).
    const sum = parseCalculatorModeParam(url.searchParams.get(searchParamsRegistry.sum))
    const merged = compactCalculatorModeParam({ ...calculatorMode.param, ...sum })
    if (merged) url.searchParams.set(searchParamsRegistry.sum, JSON.stringify(merged))
  }
}
