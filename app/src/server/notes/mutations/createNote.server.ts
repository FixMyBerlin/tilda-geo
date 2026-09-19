import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertFolderInRegion } from '../queries/assertFolderInRegion.server'
import { CreateNoteSchema } from '../schemas'

const Schema = CreateNoteSchema.extend({
  regionSlug: z.string(),
  folderId: z.number(),
})

export async function createNote(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)
  const { regionSlug, ...createData } = parsed

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertFolderInRegion(createData.folderId, regionSlug)

  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.note.create({
        data: { ...createData, userId: session.userId },
      }),
  )
  return result
}
