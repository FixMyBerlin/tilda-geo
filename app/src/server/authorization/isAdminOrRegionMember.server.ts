import { RegionStatus, UserRoleEnum } from '@/prisma/generated/client'
import db from '@/server/db.server'

/**
 * The member rule of region data files (uploads, exports, downloads), for the cookie and the
 * external API token: admins, or members of at least one of the regions. A membership of a
 * DEACTIVATED region does not count (they are admin-only, like for notes and private backgrounds).
 */
export async function isAdminOrRegionMember(
  session: { userId: string; role: UserRoleEnum },
  regionIds: number[],
) {
  if (session.role === UserRoleEnum.ADMIN) return true
  // A file without regions belongs to nobody: only admins read it.
  if (regionIds.length === 0) return false

  return !!(await db.membership.count({
    where: {
      userId: session.userId,
      regionId: { in: regionIds },
      region: { status: { not: RegionStatus.DEACTIVATED } },
    },
  }))
}
