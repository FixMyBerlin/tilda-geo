import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { type NotesCaller, notesAuditContext, requireNotesSession } from '../notesCaller.server'
import { assertNoteInRegion } from '../queries/assertFolderInRegion.server'

const Schema = z.object({
  noteId: z.number(),
  regionSlug: z.string(),
  resolved: z.boolean(),
})

export async function updateNoteResolvedAt(input: z.infer<typeof Schema>, caller: NotesCaller) {
  const session = await requireNotesSession(caller)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)
  await assertNoteInRegion(parsed.noteId, parsed.regionSlug)

  const result = await runWithAuditContextAsync(notesAuditContext(caller, session.userId), () =>
    db.note.update({
      where: { id: parsed.noteId },
      data: { resolvedAt: parsed.resolved ? new Date() : null },
    }),
  )
  return result
}
