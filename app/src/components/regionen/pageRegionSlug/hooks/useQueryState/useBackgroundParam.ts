import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { defaultBackgroundParam } from './backgroundParam.const'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useBackgroundParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const backgroundParam = search[searchParamsRegistry.bg]

  const setBackgroundParam = (value: typeof backgroundParam) => {
    // replace (switching background should not push history) + drop the default from the URL
    // (clearOnDefault parity with the old nuqs parser).
    updateSearch(
      { [searchParamsRegistry.bg]: value === defaultBackgroundParam ? undefined : value },
      { replace: true },
    )
  }

  return { backgroundParam, setBackgroundParam }
}
