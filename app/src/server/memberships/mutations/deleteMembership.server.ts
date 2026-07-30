import { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const DeleteMembership = z.object({
  id: z.number(),
})

export async function deleteMembership(input: z.infer<typeof DeleteMembership>, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { id } = DeleteMembership.parse(input)
  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.membership.deleteMany({ where: { id } }),
  )
}
