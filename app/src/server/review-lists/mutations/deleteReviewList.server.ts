import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
})

/** Delete a review list — only when it is empty and belongs to the acting region. */
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

  // A list shared with other regions is only unlinked from the acting region; it is destroyed
  // (row deleted) only when this is its last region link.
  if (list._count.regions > 1) {
    return db.reviewList.update({
      where: { id: list.id },
      data: { updatedById: session.userId, regions: { disconnect: { slug: regionSlug } } },
      select: { id: true },
    })
  }

  return db.reviewList.delete({ where: { id: list.id } })
}
