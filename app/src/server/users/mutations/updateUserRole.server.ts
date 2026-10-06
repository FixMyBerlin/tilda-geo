import type { z } from 'zod'
import { UserRoleEnum } from '@/prisma/generated/client'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import type { UpdateUserRoleSchema } from '../schema'

export async function updateUserRoleWithData(
  data: z.infer<typeof UpdateUserRoleSchema>,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    // Guard against locking yourself out; another admin has to revoke it.
    if (data.userId === admin.userId && data.role !== UserRoleEnum.ADMIN) {
      const message = 'Du kannst dir die Admin-Rechte nicht selbst entziehen.'
      return { success: false, message, errors: { role: [message] } }
    }
    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.user.update({ where: { id: data.userId }, data: { role: data.role } }),
    )
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren der Rolle')
  }
}
