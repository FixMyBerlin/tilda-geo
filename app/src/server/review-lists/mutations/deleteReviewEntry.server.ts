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
})

/** Delete a review entry (comments cascade via the schema). */
export async function deleteReviewEntry(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const { regionSlug, entryId } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertEntryInRegion(entryId, regionSlug)

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.reviewEntry.delete({ where: { id: entryId }, select: { id: true } }),
  )
}
