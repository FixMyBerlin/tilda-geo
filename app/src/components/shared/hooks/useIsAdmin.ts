import { useQuery } from '@tanstack/react-query'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

/**
 * Hook to check if the current user is an admin.
 * Returns false if user is not logged in or not an admin.
 */
export const useIsAdmin = () => {
  const { data } = useQuery(currentUserQueryOptions())
  const currentUser = data?.user ?? null
  return isAdmin(currentUser)
}
