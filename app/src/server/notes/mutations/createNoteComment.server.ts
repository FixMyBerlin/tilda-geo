import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { type NotesCaller, notesAuditContext, requireNotesSession } from '../notesCaller.server'
import { assertNoteInRegion } from '../queries/assertFolderInRegion.server'
import { CreateNoteCommentSchema } from '../schemas'

const Schema = CreateNoteCommentSchema.extend({
  regionSlug: z.string(),
  noteId: z.number(),
  body: z.string(),
})

export async function createNoteComment(input: z.infer<typeof Schema>, caller: NotesCaller) {
  const session = await requireNotesSession(caller)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)
  await assertNoteInRegion(parsed.noteId, parsed.regionSlug)

  const result = await runWithAuditContextAsync(notesAuditContext(caller, session.userId), () =>
    db.noteComment.create({
      data: { noteId: parsed.noteId, body: parsed.body, userId: session.userId },
    }),
  )
  return result
}
