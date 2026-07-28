import type { AppSession } from '@/server/auth/types'
import { membershipExists } from '@/server/memberships/queries/membershipExists.server'

export async function getRegionHasPermissions(session: AppSession | null, regionSlug: string) {
  const role = session?.role
  if (role === 'ADMIN') {
    return true
  }

  const userId = session?.userId
  if (!userId) {
    return false
  }

  return membershipExists({ userId, regionSlug })
}
