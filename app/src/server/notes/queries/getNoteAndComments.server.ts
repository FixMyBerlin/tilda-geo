import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByNoteId } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { NoteAndCommentsSchema } from '../schemas'

const GetNote = z.object({ id: z.number() })

export type NoteAndComments = Awaited<ReturnType<typeof getNoteAndComments>>
export type NoteComment = NonNullable<NonNullable<NoteAndComments>['noteComments']>[number]

/** Returns note with comments or null if not found. Caller (e.g. server function) should throw notFound() when null. */
export async function getNoteAndComments(input: z.infer<typeof GetNote>, headers: Headers) {
  const session = await requireAuth(headers)
  const { id } = GetNote.parse(input)

  await authorizeRegionMemberByNoteId(session, id)

  const author = {
    id: true,
    osmName: true,
    role: true,
    firstName: true,
    lastName: true,
  }

  const note = await db.note.findFirst({
    where: { id },
    include: {
      noteComments: {
        select: {
          id: true,
          noteId: true,
          createdAt: true,
          updatedAt: true,
          body: true,
          author: { select: author },
        },
        orderBy: { id: 'asc' },
      },
      author: { select: author },
    },
  })

  if (!note) return null
  return NoteAndCommentsSchema.parse(note)
}
