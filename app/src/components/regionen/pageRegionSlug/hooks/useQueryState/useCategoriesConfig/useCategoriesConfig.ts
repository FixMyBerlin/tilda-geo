import { useSearch } from '@tanstack/react-router'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from '../useRegionSearchNavigation'
import { createFreshCategoriesConfig } from './createFreshCategoriesConfig'
import type { MapDataCategoryConfig } from './type'
import { calcConfigChecksum } from './v2/lib'
import { parse } from './v2/parse'
import { serialize } from './v2/serialize'

// Invariant: ?config= is normalized in the region loader — see ./README.md
export const useCategoriesConfig = () => {
  const region = useRegion()
  const { updateSearch } = useRegionSearchNavigation()
  // Only this param: the whole search object is new on every URL change (each map move), and
  // parsing the config is too slow to repeat then.
  const configWire = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.config],
  })
  const freshConfig = createFreshCategoriesConfig(region?.categories ?? [])

  const checksum = configWire?.split('.')[0]
  const categoriesConfig =
    configWire && checksum === calcConfigChecksum(freshConfig)
      ? parse(configWire, freshConfig)
      : freshConfig

  const setCategoriesConfig = (value: MapDataCategoryConfig[], options?: { replace?: boolean }) => {
    updateSearch({ [searchParamsRegistry.config]: serialize(value) }, options)
  }

  return { categoriesConfig, setCategoriesConfig }
}
