import type { AppSession } from '@/server/auth/types'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import db from '@/server/db.server'

/**
 * QA is member/admin-only. {@link checkRegionAuthorization} allows anyone on PUBLIC regions;
 * for QA we still require membership (or admin) on those regions.
 */
export async function canAccessQaForRegion(session: AppSession | null, regionSlug: string) {
  const base = await checkRegionAuthorization(session, regionSlug)

  if (!base.isAuthorized || base.regionId == null) {
    return { isAuthorized: false }
  }

  if (session?.role === 'ADMIN') {
    return { isAuthorized: true, regionId: base.regionId }
  }

  if (!session?.userId) {
    return { isAuthorized: false, regionId: base.regionId }
  }

  const region = await db.region.findFirst({
    where: { id: base.regionId },
    select: { status: true },
  })

  if (region?.status === 'PRIVATE') {
    // checkRegionAuthorization only returns true for PRIVATE when the user is a member.
    return { isAuthorized: true, regionId: base.regionId }
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: session.userId,
      regionId: base.regionId,
    },
  })

  return { isAuthorized: !!membership, regionId: base.regionId }
}
