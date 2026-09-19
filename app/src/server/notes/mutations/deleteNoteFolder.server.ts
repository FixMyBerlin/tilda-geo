import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  folderId: z.number(),
})

/**
 * Member delete of a note folder — only when it is empty and linked to the acting region only.
 * Region links are admin-only, so a shared folder must be unlinked in admin first.
 */
export async function deleteNoteFolder(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, folderId } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const folder = await db.noteFolder.findFirstOrThrow({
    where: { id: folderId, regions: { some: { slug: regionSlug } } },
    select: { id: true, _count: { select: { notes: true, regions: true } } },
  })
  if (folder._count.notes > 0) {
    throw new Error('Nur leere Ordner können gelöscht werden.')
  }

  if (folder._count.regions > 1) {
    throw new Error(
      'Dieser Ordner ist mehreren Regionen zugeordnet und kann nur im Admin-Bereich gelöscht werden.',
    )
  }

  return db.noteFolder.delete({ where: { id: folder.id } })
}
