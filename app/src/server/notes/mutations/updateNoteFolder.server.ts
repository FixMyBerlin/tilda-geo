import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  folderId: z.number(),
  name: z.string().trim().min(1),
})

/**
 * Member rename of a note folder linked to the acting region. Region links are admin-only
 * (`updateNoteFolderForAdmin`).
 */
export async function updateNoteFolder(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, folderId, name } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const folder = await db.noteFolder.findFirstOrThrow({
    where: { id: folderId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })

  return db.noteFolder.update({
    where: { id: folder.id },
    data: { updatedById: session.userId, name },
    select: { id: true, name: true },
  })
}
