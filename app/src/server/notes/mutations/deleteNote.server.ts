import { z } from 'zod'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({ regionSlug: z.string(), noteId: z.number() })

export async function deleteNote(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  // Only author may delete own note
  const { userId: dbUserId } = await db.note.findFirstOrThrow({
    where: { id: parsed.noteId },
    select: { userId: true },
  })

  if (dbUserId !== session.userId) {
    throw new AuthorizationError('Only the author can delete this note')
  }

  // Note: schema.prisma defines an `onDelete: cascade` rule which will remove all noteComments whenever a node is deleted
  // Docs: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#cascade
  const result = await db.note.deleteMany({
    where: { id: parsed.noteId },
  })
  return result
}
