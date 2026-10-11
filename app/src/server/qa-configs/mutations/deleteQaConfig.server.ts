import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  adminAuditContext,
  type MemberCaller,
  requireAdminSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { DeleteQaConfigSchema } from '../schemas'

export async function deleteQaConfig(input: { id: number }, caller: MemberCaller) {
  const admin = await requireAdminSession(caller)
  const { id } = DeleteQaConfigSchema.parse(input)
  return runWithAuditContextAsync(adminAuditContext(caller, admin.userId), () =>
    db.qaConfig.delete({ where: { id } }),
  )
}
