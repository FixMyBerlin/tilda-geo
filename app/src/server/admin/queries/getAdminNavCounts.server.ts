import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export type AdminNavCounts = Awaited<ReturnType<typeof getAdminNavCounts>>

export async function getAdminNavCounts(headers: Headers) {
  await requireAdmin(headers)

  const [regions, regionContracts, reviewLists, users, uploads, qaConfigsActive] =
    await Promise.all([
      db.region.count(),
      db.regionContract.count(),
      db.reviewList.count(),
      db.user.count(),
      db.mapDatasetUpload.count(),
      db.qaConfig.count({ where: { isActive: true } }),
    ])

  return { regions, regionContracts, reviewLists, users, uploads, qaConfigsActive }
}
