import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useQaFilterParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const qaFilterParam = search[searchParamsRegistry.qaFilter]

  const setQaFilterParam = (value: typeof qaFilterParam) => {
    updateSearch({ [searchParamsRegistry.qaFilter]: value }, { replace: true })
  }

  // Use the functional updater (fresh `prev`) rather than the render-captured `qaFilterParam`, so
  // rapid successive toggles compose correctly instead of each overwriting a stale snapshot.
  const toggleUser = (userId: string) => {
    updateSearch(
      (prev) => {
        const current = prev[searchParamsRegistry.qaFilter]
        const currentUsers = current?.users || []
        const newUsers = currentUsers.includes(userId)
          ? currentUsers.filter((id) => id !== userId)
          : [...currentUsers, userId]
        return {
          [searchParamsRegistry.qaFilter]: {
            ...current,
            users: newUsers.length > 0 ? newUsers : undefined,
          },
        }
      },
      { replace: true },
    )
  }

  const clearUsers = () => {
    updateSearch(
      (prev) => ({
        [searchParamsRegistry.qaFilter]: {
          ...prev[searchParamsRegistry.qaFilter],
          users: undefined,
        },
      }),
      { replace: true },
    )
  }

  return { qaFilterParam, setQaFilterParam, toggleUser, clearUsers }
}
