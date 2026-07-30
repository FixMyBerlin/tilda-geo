import type { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import { CreateQaConfigFormSchema } from '../schemas'

export async function createQaConfigWithData(
  data: z.infer<typeof CreateQaConfigFormSchema>,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.qaConfig.create({ data }),
    )
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Anlegen der QA-Konfiguration')
  }
}
