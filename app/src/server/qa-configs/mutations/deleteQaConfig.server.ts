import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteQaConfigSchema } from '../schemas'

export async function deleteQaConfig(input: { id: number }, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { id } = DeleteQaConfigSchema.parse(input)
  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.qaConfig.delete({ where: { id } }),
  )
}
