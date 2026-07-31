import {
  getQaParamFromSearch,
  serializeQaParam,
  type QaParamData,
} from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useQaParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const qaParamData = getQaParamFromSearch(search)

  const setQaParamData = (value: QaParamData) => {
    // replace (a QA-style change should not push history); serializeQaParam returns undefined for
    // the default (style 'none'), so disabling QA drops `qa` from the URL instead of leaving `qa=`.
    updateSearch({ [searchParamsRegistry.qa]: serializeQaParam(value) }, { replace: true })
  }

  return { qaParamData, setQaParamData }
}
