import { notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export async function getReviewList(input: { id: number }, headers: Headers) {
  await requireAdmin(headers)

  const list = await db.reviewList.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      regions: { select: { slug: true, name: true }, orderBy: { slug: 'asc' } },
      _count: { select: { entries: true } },
    },
  })

  if (!list) throw notFound()

  return {
    id: list.id,
    name: list.name,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    regionSlugs: list.regions.map((region) => region.slug),
    entryCount: list._count.entries,
  }
}
