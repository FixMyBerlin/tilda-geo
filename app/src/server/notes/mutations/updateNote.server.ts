import { z } from 'zod'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  noteId: z.number(),
  subject: z.string(),
  body: z.string(),
  resolved: z.boolean(),
  regionSlug: z.string(),
})

export async function updateNote(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  // Only author may update own note
  const { userId: dbUserId } = await db.note.findFirstOrThrow({
    where: { id: parsed.noteId },
    select: { userId: true },
  })

  if (dbUserId !== session.userId) {
    throw new AuthorizationError('Only the author can update this note')
  }

  const result = await db.note.update({
    where: { id: parsed.noteId },
    data: {
      subject: parsed.subject,
      body: parsed.body,
      resolvedAt: parsed.resolved ? new Date() : null,
    },
  })
  return result
}
