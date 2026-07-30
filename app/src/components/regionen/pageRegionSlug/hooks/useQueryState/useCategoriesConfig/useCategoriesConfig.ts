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
  const { search, updateSearch } = useRegionSearchNavigation()
  const freshConfig = createFreshCategoriesConfig(region?.categories ?? [])

  const configWire = search[searchParamsRegistry.config]
  const checksum = configWire?.split('.')[0]
  const categoriesConfig =
    configWire && checksum === calcConfigChecksum(freshConfig)
      ? parse(configWire, freshConfig)
      : freshConfig

  const setCategoriesConfig = (value: MapDataCategoryConfig[]) => {
    updateSearch({ [searchParamsRegistry.config]: serialize(value) })
  }

  return { categoriesConfig, setCategoriesConfig }
}
