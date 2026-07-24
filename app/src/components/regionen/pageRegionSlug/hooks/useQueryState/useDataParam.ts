import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useDataParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const dataParam = search[searchParamsRegistry.data]

  const setDataParam = (value: string[]) => {
    // replace: toggling datasets should not push a browser-history entry (old nuqs default).
    updateSearch(
      { [searchParamsRegistry.data]: value.length > 0 ? value : undefined },
      { replace: true },
    )
  }

  return { dataParam, setDataParam }
}
