import { isAdmin } from '@/components/shared/utils/usersUtils'
import { useCurrentUser } from './useCurrentUser'

/**
 * Hook to check if the current user is an admin.
 * Returns false if user is not logged in or not an admin.
 */
export const useIsAdmin = () => {
  const currentUser = useCurrentUser()
  return isAdmin(currentUser)
}
