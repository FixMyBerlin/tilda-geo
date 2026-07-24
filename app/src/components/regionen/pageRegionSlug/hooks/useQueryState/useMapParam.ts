import { getMapParamFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { serializeMapParam, type MapParam } from './utils/mapParam'

type SetMapParamOptions = {
  history?: 'push' | 'replace'
}

export const useMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const mapParam = getMapParamFromSearch(search)

  const setMapParam = (value: MapParam, options?: SetMapParamOptions) => {
    updateSearch(
      { [searchParamsRegistry.map]: serializeMapParam(value) },
      { replace: options?.history === 'replace' },
    )
  }

  return { mapParam, setMapParam }
}
