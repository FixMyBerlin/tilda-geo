import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
  name: z.string().trim().min(1),
})

/**
 * Member rename of a review list linked to the acting region. Region links are admin-only
 * (`updateReviewListForAdmin`).
 */
export async function updateReviewList(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, listId, name } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const list = await db.reviewList.findFirstOrThrow({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })

  return db.reviewList.update({
    where: { id: list.id },
    data: { updatedById: session.userId, name },
    select: { id: true, name: true },
  })
}
