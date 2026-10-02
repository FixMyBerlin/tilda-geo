import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { type NotesCaller, notesAuditContext, requireNotesSession } from '../notesCaller.server'
import { assertFolderInRegion } from '../queries/assertFolderInRegion.server'
import { CreateNoteSchema } from '../schemas'

const Schema = CreateNoteSchema.extend({
  regionSlug: z.string(),
  folderId: z.number(),
})

export async function createNote(input: z.infer<typeof Schema>, caller: NotesCaller) {
  const session = await requireNotesSession(caller)
  const parsed = Schema.parse(input)
  const { regionSlug, ...createData } = parsed

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertFolderInRegion(createData.folderId, regionSlug)

  const result = await runWithAuditContextAsync(notesAuditContext(caller, session.userId), () =>
    db.note.create({
      data: { ...createData, userId: session.userId },
    }),
  )
  return result
}
