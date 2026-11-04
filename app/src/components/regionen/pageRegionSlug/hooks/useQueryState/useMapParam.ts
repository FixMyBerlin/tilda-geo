import { getMapParamFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegion } from '../../regionUtils/useRegion'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { serializeMapParam, type MapParam } from './utils/mapParam'

type SetMapParamOptions = {
  history?: 'push' | 'replace'
}

export const useMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const region = useRegion()
  const mapParam = getMapParamFromSearch(search, region.map)

  const setMapParam = (value: MapParam, options?: SetMapParamOptions) => {
    updateSearch(
      { [searchParamsRegistry.map]: serializeMapParam(value) },
      { replace: options?.history === 'replace' },
    )
  }

  return { mapParam, setMapParam }
}
