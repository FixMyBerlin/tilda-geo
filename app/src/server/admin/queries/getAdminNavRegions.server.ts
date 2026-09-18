import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export type AdminNavRegion = Awaited<ReturnType<typeof getAdminNavRegions>>[number]

/** Slim region list for the admin region search (dashboard + region edit header; no config payload). */
export async function getAdminNavRegions(headers: Headers) {
  await requireAdmin(headers)

  return db.region.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      fullName: true,
      status: true,
    },
    orderBy: [{ name: 'asc' }, { slug: 'asc' }],
  })
}
