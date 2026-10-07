import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { auditRegionLinksChange } from '@/server/audit/auditRegionLinks.server'
import {
  adminAuditContext,
  type MemberCaller,
  requireAdminSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import type { NoteFolderConfigInput } from '../schemas'

export async function updateNoteFolderForAdmin(
  id: number,
  data: NoteFolderConfigInput,
  caller: MemberCaller,
) {
  try {
    const admin = await requireAdminSession(caller)
    await runWithAuditContextAsync(adminAuditContext(caller, admin.userId), async () => {
      const before = await db.noteFolder.findUnique({
        where: { id },
        select: { regions: { select: { slug: true } } },
      })
      await db.noteFolder.update({
        where: { id },
        data: {
          name: data.name,
          updatedById: admin.userId,
          regions: { set: data.regionSlugs.map((slug) => ({ slug })) },
        },
      })
      await auditRegionLinksChange({
        model: 'NoteFolder',
        recordId: id,
        oldRegionSlugs: before?.regions.map((region) => region.slug) ?? [],
        newRegionSlugs: data.regionSlugs,
      })
    })
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren des Ordners')
  }
}
