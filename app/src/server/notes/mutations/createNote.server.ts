import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertFolderInRegion } from '../queries/assertFolderInRegion.server'
import { CreateNoteSchema } from '../schemas'

const Schema = CreateNoteSchema.extend({
  regionSlug: z.string(),
  folderId: z.number(),
})

export async function createNote(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const parsed = Schema.parse(input)
  const { regionSlug, ...createData } = parsed

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertFolderInRegion(createData.folderId, regionSlug)

  const result = await runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.note.create({
      data: { ...createData, userId: session.userId },
    }),
  )
  return result
}
