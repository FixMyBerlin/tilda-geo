import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertEntryInRegion } from '../queries/assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
  body: z.string().trim().min(1),
})

/** Add a comment to a review entry (functionally analogous to NoteComment, separate table). */
export async function createReviewEntryComment(
  input: z.infer<typeof Schema>,
  caller: MemberCaller,
) {
  const session = await requireMemberSession(caller)
  const { regionSlug, entryId, body } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertEntryInRegion(entryId, regionSlug)

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.reviewEntryComment.create({
      data: { entryId, userId: session.userId, body },
      select: { id: true },
    }),
  )
}
