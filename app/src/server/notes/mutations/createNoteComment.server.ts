import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { CreateNoteCommentSchema } from '../schemas'

const Schema = CreateNoteCommentSchema.extend({
  regionSlug: z.string(),
  noteId: z.number(),
  body: z.string(),
})

export async function createNoteComment(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  const result = await db.noteComment.create({
    data: { noteId: parsed.noteId, body: parsed.body, userId: session.userId },
  })
  return result
}
