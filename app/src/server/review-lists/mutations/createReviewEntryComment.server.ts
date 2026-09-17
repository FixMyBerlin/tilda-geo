import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertEntryInRegion } from '../queries/assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
  body: z.string().trim().min(1),
})

/** Add a comment to a review entry (functionally analogous to NoteComment, separate table). */
export async function createReviewEntryComment(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, entryId, body } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertEntryInRegion(entryId, regionSlug)

  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.reviewEntryComment.create({
        data: { entryId, userId: session.userId, body },
        select: { id: true },
      }),
  )
  return result
}
