import type { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import { UpdateQaConfigFormSchema } from '../schemas'

export async function updateQaConfigWithData(
  data: z.infer<typeof UpdateQaConfigFormSchema>,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    const { id, ...updateData } = data
    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.qaConfig.update({ where: { id }, data: updateData }),
    )
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren der QA-Konfiguration')
  }
}
