import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { AuthorizationError } from '@/server/auth/errors'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  commentId: z.number(),
  body: z.string().trim().min(1),
})

/** Author edits their own comment on a review entry (same rule as internal note comments). */
export async function updateReviewEntryComment(
  input: z.infer<typeof Schema>,
  caller: MemberCaller,
) {
  const session = await requireMemberSession(caller)
  const { regionSlug, commentId, body } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const comment = await db.reviewEntryComment.findFirstOrThrow({
    where: { id: commentId, entry: { list: { regions: { some: { slug: regionSlug } } } } },
    select: { userId: true },
  })
  if (comment.userId !== session.userId) {
    throw new AuthorizationError('Only the author can update this comment')
  }

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.reviewEntryComment.update({
      where: { id: commentId },
      data: { body },
      select: { id: true },
    }),
  )
}
