import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { searchParamsRegistry } from './searchParamsRegistry'

export const zodQaFilterParam = z.object({
  users: z.array(z.string()).optional().nullable(),
})

export const useQaFilterParam = () => {
  const [qaFilterParam, setQaFilterParam] = useQueryState(
    searchParamsRegistry.qaFilter,
    parseAsJson(zodQaFilterParam.parse).withOptions({
      shallow: false, // Trigger server re-render when filter changes
    }),
  )

  const toggleUser = (userId: string) => {
    const currentUsers = qaFilterParam?.users || []
    const isSelected = currentUsers.includes(userId)

    if (isSelected) {
      // Remove user
      const newUsers = currentUsers.filter((id) => id !== userId)
      setQaFilterParam({ ...qaFilterParam, users: newUsers.length > 0 ? newUsers : undefined })
    } else {
      // Add user
      const newUsers = [...currentUsers, userId]
      setQaFilterParam({ ...qaFilterParam, users: newUsers })
    }
  }

  const clearUsers = () => {
    setQaFilterParam({ ...qaFilterParam, users: undefined })
  }

  return { qaFilterParam, setQaFilterParam, toggleUser, clearUsers }
}
