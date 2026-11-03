import {
  compactQaParam,
  QA_STATUS_SELECT_ALL,
  resolvedQaStatusKeys,
  type QaParamData,
  type QaStatusKey,
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

  /** Applies `patch` to the current `qa` param; a no-op (no `key` yet) clears it instead. */
  const updateQaParamData = (patch: (current: QaParamData) => QaParamData) => {
    updateSearch(
      (prev) => {
        const current = getQaParamFromSearch(prev)
        if (!current.key) return { [searchParamsRegistry.qa]: undefined }
        return { [searchParamsRegistry.qa]: compactQaParam(patch(current)) }
      },
      { replace: true },
    )
  }

  /** Toggles one status. Removing the last one falls back to Alle. */
  const toggleStatus = (statusKey: QaStatusKey) => {
    updateQaParamData((current) => {
      const currentKeys = resolvedQaStatusKeys(current.status) ?? []
      const nextKeys = currentKeys.includes(statusKey)
        ? currentKeys.filter((key) => key !== statusKey)
        : [...currentKeys, statusKey]
      return { ...current, status: nextKeys.length > 0 ? nextKeys : QA_STATUS_SELECT_ALL }
    })
  }

  const clearStatuses = () => {
    updateQaParamData((current) => ({ ...current, status: QA_STATUS_SELECT_ALL }))
  }

  const toggleUser = (userId: string) => {
    updateQaParamData((current) => {
      const currentUsers = current.users || []
      const newUsers = currentUsers.includes(userId)
        ? currentUsers.filter((id) => id !== userId)
        : [...currentUsers, userId]
      return { ...current, users: newUsers.length > 0 ? newUsers : undefined }
    })
  }

  const clearUsers = () => {
    updateQaParamData((current) => ({ ...current, users: undefined }))
  }

  /** Toggles one indicator key. Starting point (no `ind` in the URL) is "every indicator". */
  const toggleIndicator = (indicatorKey: string, allIndicatorKeys: readonly string[]) => {
    updateQaParamData((current) => {
      const currentKeys = current.ind && current.ind.length > 0 ? current.ind : allIndicatorKeys
      const nextKeys = currentKeys.includes(indicatorKey)
        ? currentKeys.filter((key) => key !== indicatorKey)
        : [...currentKeys, indicatorKey]
      return { ...current, ind: nextKeys.length > 0 ? nextKeys : undefined }
    })
  }

  /** "Alle Attribute": back to no indicator filter. */
  const clearIndicators = () => {
    updateQaParamData((current) => ({ ...current, ind: undefined }))
  }

  return {
    qaParamData,
    setQaParamData,
    toggleStatus,
    clearStatuses,
    toggleUser,
    clearUsers,
    toggleIndicator,
    clearIndicators,
  }
}
