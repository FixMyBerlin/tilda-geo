import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { authClient } from '@/components/shared/auth/auth-client'
import { currentUserQueryKey } from '@/server/users/currentUserQueryOptions'

/**
 * Shared logout handler used by the desktop user dropdown (UserLoggedIn) and the
 * mobile user sheet (MobileUserMenu).
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const navigate = useNavigate()
  const { clearInspectorFeatures } = useMapActions()

  return async function handleLogout() {
    // We need to reset the inspector because it might hold atlas notes which would throw an authorization error if left open
    clearInspectorFeatures()
    await authClient.signOut()
    await queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
    await router.invalidate()
    navigate({ to: '/' })
  }
}
