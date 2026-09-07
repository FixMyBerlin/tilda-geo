import type { AppSession } from '@/server/auth/types'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { getRegionHasPermissions } from '@/server/authorization/getRegionHasPermissions.server'

/**
 * Member/admin-only modes (QA, Prüflisten). {@link checkRegionAuthorization} allows anyone on
 * PUBLIC regions; these modes still require membership (or admin) on those regions.
 */
export async function canAccessMemberModeForRegion(session: AppSession | null, regionSlug: string) {
  const base = await checkRegionAuthorization(session, regionSlug)

  if (!base.isAuthorized || base.regionId == null) {
    return { isAuthorized: false as const }
  }

  const hasPermissions = await getRegionHasPermissions(session, regionSlug)
  if (!hasPermissions) {
    return { isAuthorized: false as const, regionId: base.regionId }
  }

  return { isAuthorized: true as const, regionId: base.regionId }
}
