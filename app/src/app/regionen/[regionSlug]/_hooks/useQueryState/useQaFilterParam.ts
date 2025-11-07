import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { searchParamsRegistry } from './searchParamsRegistry'
import { createMemoizer } from './utils/createMemoizer'

const memoizer = createMemoizer()

export const zodQaFilterParam = z.object({
  users: z.array(z.coerce.number()).optional().nullable(),
})

export const useQaFilterParam = () => {
  const [qaFilterParam, setQaFilterParam] = useQueryState(
    searchParamsRegistry.qaFilter,
    parseAsJson(zodQaFilterParam.parse),
  )

  const toggleUser = (userId: number) => {
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

  return memoizer({ qaFilterParam, setQaFilterParam, toggleUser, clearUsers })
}
