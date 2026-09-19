import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import type { NoteFolderConfigInput } from '../schemas'

export async function updateNoteFolderForAdmin(
  id: number,
  data: NoteFolderConfigInput,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.noteFolder.update({
        where: { id },
        data: {
          name: data.name,
          updatedById: admin.userId,
          regions: { set: data.regionSlugs.map((slug) => ({ slug })) },
        },
      }),
    )
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren des Ordners')
  }
}
