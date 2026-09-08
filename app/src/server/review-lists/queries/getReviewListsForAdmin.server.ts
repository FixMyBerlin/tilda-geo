import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export async function getReviewListsForAdmin(headers: Headers) {
  await requireAdmin(headers)

  const lists = await db.reviewList.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      regions: { select: { slug: true, name: true }, orderBy: { slug: 'asc' } },
      _count: { select: { entries: true } },
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    regionSlugs: list.regions.map((region) => region.slug),
    regionNames: list.regions.map((region) => region.name),
    entryCount: list._count.entries,
  }))
}
