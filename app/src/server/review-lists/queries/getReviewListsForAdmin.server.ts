import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { reviewListsInRegionWhere } from '@/server/regions/regionScopedWhere'
import { optionalTrimmed } from '@/server/utils/searchString'

export async function getReviewListsForAdmin(input: { regionSlug?: string }, headers: Headers) {
  await requireAdmin(headers)

  const regionSlug = optionalTrimmed(input.regionSlug)
  const lists = await db.reviewList.findMany({
    where: regionSlug ? reviewListsInRegionWhere(regionSlug) : undefined,
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
