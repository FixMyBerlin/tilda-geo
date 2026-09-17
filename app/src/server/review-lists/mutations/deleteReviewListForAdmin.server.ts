import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteReviewListSchema } from '../schemas'

/** Admin delete: cascades to entries and comments (unlike member delete, which only allows empty lists). */
export async function deleteReviewListForAdmin(input: { id: number }, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { id } = DeleteReviewListSchema.parse(input)
  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.reviewList.delete({ where: { id } }),
  )
}
