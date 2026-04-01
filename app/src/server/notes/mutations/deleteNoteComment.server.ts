import { z } from 'zod'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({ regionSlug: z.string(), commentId: z.number() })

export async function deleteNoteComment(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  // Only author may delete own note comment
  const { userId: dbUserId } = await db.noteComment.findFirstOrThrow({
    where: { id: parsed.commentId },
    select: { userId: true },
  })

  if (dbUserId !== session.userId) {
    throw new AuthorizationError('Only the author can delete this comment')
  }

  const result = await db.noteComment.deleteMany({
    where: { id: parsed.commentId },
  })
  return result
}
