import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertFolderInRegion, assertNoteInRegion } from '../queries/assertFolderInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  noteId: z.number(),
  folderId: z.number(),
})

/** Moves a note into another folder — both the note and the target folder must belong to the acting region. */
export async function moveNoteToFolder(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const { regionSlug, noteId, folderId } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertNoteInRegion(noteId, regionSlug)
  await assertFolderInRegion(folderId, regionSlug)

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.note.update({
      where: { id: noteId },
      data: { folderId },
      select: { id: true, folderId: true },
    }),
  )
}
