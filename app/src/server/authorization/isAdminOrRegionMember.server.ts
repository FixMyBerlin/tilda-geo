import { RegionStatus, UserRoleEnum } from '@/prisma/generated/client'
import db from '@/server/db.server'

/**
 * Which memberships count for region data (uploads and their list, exports, downloads), for the
 * cookie and the external API token: a membership of a DEACTIVATED region does not (they are
 * admin-only, like for notes and private backgrounds). The one place for this rule.
 */
const countedMembershipWhere = (userId: string) => ({
  userId,
  region: { status: { not: RegionStatus.DEACTIVATED } },
})

/** The regions whose memberships count for the user, see `countedMembershipWhere`. */
export async function memberRegionIds(userId: string) {
  const memberships = await db.membership.findMany({
    where: countedMembershipWhere(userId),
    select: { regionId: true },
  })
  return memberships.map(({ regionId }) => regionId)
}

/** The member rule of region data files: admins, or members of at least one of the regions. */
export async function isAdminOrRegionMember(
  session: { userId: string; role: UserRoleEnum },
  regionIds: number[],
) {
  if (session.role === UserRoleEnum.ADMIN) return true
  // A file without regions belongs to nobody: only admins read it.
  if (regionIds.length === 0) return false

  return !!(await db.membership.count({
    where: { ...countedMembershipWhere(session.userId), regionId: { in: regionIds } },
  }))
}
