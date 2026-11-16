import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { ReviewListStatusStylesSchema } from '@/shared/reviewLists/reviewListStatusStyles'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
  name: z.string().trim().min(1),
  statusStyles: ReviewListStatusStylesSchema.optional(),
})

/**
 * Member edit (name, status labels and colors) of a review list linked to the acting region. Region links are admin-only
 * (`updateReviewListForAdmin`).
 */
export async function updateReviewList(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const { regionSlug, listId, name, statusStyles } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const list = await db.reviewList.findFirstOrThrow({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.reviewList.update({
      where: { id: list.id },
      data: { updatedById: session.userId, name, statusStyles },
      select: { id: true, name: true },
    }),
  )
}
