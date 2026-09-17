import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
})

/**
 * Member delete of a review list — only when it is empty and linked to the acting region only.
 * Region links are admin-only, so a shared list must be unlinked in admin first.
 */
export async function deleteReviewList(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, listId } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const list = await db.reviewList.findFirstOrThrow({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true, _count: { select: { entries: true, regions: true } } },
  })
  if (list._count.entries > 0) {
    throw new Error('Nur leere Prüflisten können gelöscht werden.')
  }

  if (list._count.regions > 1) {
    throw new Error(
      'Diese Prüfliste ist mehreren Regionen zugeordnet und kann nur im Admin-Bereich gelöscht werden.',
    )
  }

  return db.reviewList.delete({ where: { id: list.id } })
}
