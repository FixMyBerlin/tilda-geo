import {
  compactQaParam,
  type QaParamData,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { getQaParamFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useQaParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const qaParamData = getQaParamFromSearch(search)

  const setQaParamData = (value: QaParamData) => {
    updateSearch({ [searchParamsRegistry.qa]: compactQaParam(value) }, { replace: true })
  }

  const toggleUser = (userId: string) => {
    updateSearch(
      (prev) => {
        const current = getQaParamFromSearch(prev)
        if (!current.key) return { [searchParamsRegistry.qa]: undefined }
        const currentUsers = current.users || []
        const newUsers = currentUsers.includes(userId)
          ? currentUsers.filter((id) => id !== userId)
          : [...currentUsers, userId]
        return {
          [searchParamsRegistry.qa]: compactQaParam({
            ...current,
            users: newUsers.length > 0 ? newUsers : undefined,
          }),
        }
      },
      { replace: true },
    )
  }

  const clearUsers = () => {
    updateSearch(
      (prev) => {
        const current = getQaParamFromSearch(prev)
        if (!current.key) return { [searchParamsRegistry.qa]: undefined }
        return {
          [searchParamsRegistry.qa]: compactQaParam({ ...current, users: undefined }),
        }
      },
      { replace: true },
    )
  }

  return { qaParamData, setQaParamData, toggleUser, clearUsers }
}
