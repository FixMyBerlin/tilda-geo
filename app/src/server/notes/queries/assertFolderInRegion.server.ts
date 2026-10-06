import { AuthorizationError } from '@/server/auth/errors'
import db from '@/server/db.server'

/** Throws unless the note folder is linked to the region; returns the folder id. */
export async function assertFolderInRegion(folderId: number, regionSlug: string) {
  const folder = await db.noteFolder.findFirst({
    where: { id: folderId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })
  if (!folder) throw new AuthorizationError('Note folder does not belong to this region')
  return folder.id
}

/** Throws unless the note's folder is linked to the region; returns the note id. */
export async function assertNoteInRegion(noteId: number, regionSlug: string) {
  const note = await db.note.findFirst({
    where: { id: noteId, folder: { regions: { some: { slug: regionSlug } } } },
    select: { id: true },
  })
  if (!note) throw new AuthorizationError('Note does not belong to this region')
  return note.id
}
