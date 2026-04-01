import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  noteId: z.number(),
  regionSlug: z.string(),
  resolved: z.boolean(),
})

export async function updateNoteResolvedAt(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, parsed.regionSlug)

  const result = await db.note.update({
    where: { id: parsed.noteId },
    data: { resolvedAt: parsed.resolved ? new Date() : null },
  })
  return result
}
