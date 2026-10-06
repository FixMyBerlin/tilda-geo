import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteNoteFolderSchema } from '../schemas'

/**
 * Admin delete: empty folders only, same as the member delete
 * (`deleteNoteFolder.server.ts`). Unlike `deleteReviewListForAdmin`, this does not cascade to
 * notes — `Note.folder` is `onDelete: Restrict`, so non-empty folders must be emptied first
 * (move or delete their notes) before they can be deleted here.
 */
export async function deleteNoteFolderForAdmin(input: { id: number }, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { id } = DeleteNoteFolderSchema.parse(input)

  const folder = await db.noteFolder.findUniqueOrThrow({
    where: { id },
    select: { _count: { select: { notes: true } } },
  })
  if (folder._count.notes > 0) {
    throw new Error('Nur leere Ordner können gelöscht werden.')
  }

  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.noteFolder.delete({ where: { id } }),
  )
}
