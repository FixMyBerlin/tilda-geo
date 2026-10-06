import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  adminAuditContext,
  type MemberCaller,
  requireAdminSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import type { ReviewListConfigInput } from '../schemas'

export async function updateReviewListForAdmin(
  id: number,
  data: ReviewListConfigInput,
  caller: MemberCaller,
) {
  try {
    const admin = await requireAdminSession(caller)
    await runWithAuditContextAsync(adminAuditContext(caller, admin.userId), () =>
      db.reviewList.update({
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
    return errorState(error, 'Fehler beim Aktualisieren der Prüfliste')
  }
}
