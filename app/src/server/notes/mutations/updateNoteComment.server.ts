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

const Schema = z.object({ regionSlug: z.string(), commentId: z.number(), body: z.string() })

export async function updateNoteComment(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  // Only author may update own note comment
  const { userId: dbUserId } = await db.noteComment.findFirstOrThrow({
    where: {
      id: parsed.commentId,
      note: { folder: { regions: { some: { slug: parsed.regionSlug } } } },
    },
    select: { userId: true },
  })

  if (dbUserId !== session.userId) {
    throw new AuthorizationError('Only the author can update this comment')
  }

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.noteComment.update({ where: { id: parsed.commentId }, data: { body: parsed.body } }),
  )
}
