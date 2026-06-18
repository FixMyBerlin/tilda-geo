import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { useOptionalRegionSlug } from '@/components/shared/hooks/useOptionalRegionSlug'
import { isContactProfileIncomplete } from '@/components/shared/utils/osmPlaceholderEmail'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'

/**
 * Whether the signed-in user has account todos that warrant the amber dot on the
 * avatar button (missing contact email/name, missing OSM description, or no
 * permissions on the current region). Shared by the desktop dropdown and the
 * mobile user menu.
 */
export const useUserHasTodos = (user: NonNullable<CurrentUser>) => {
  const isRegionsPage = Boolean(useOptionalRegionSlug())
  const hasPermissions = useHasPermissions()

  const missingOsmDescription = !user.osmDescription?.trim()
  const regionButNoPermission = isRegionsPage && hasPermissions === false

  return isContactProfileIncomplete(user) || missingOsmDescription || regionButNoPermission
}
