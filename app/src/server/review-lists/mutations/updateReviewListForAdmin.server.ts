import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { auditRegionLinksChange } from '@/server/audit/auditRegionLinks.server'
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
    await runWithAuditContextAsync(adminAuditContext(caller, admin.userId), async () => {
      const before = await db.reviewList.findUnique({
        where: { id },
        select: { regions: { select: { slug: true } } },
      })
      await db.reviewList.update({
        where: { id },
        data: {
          name: data.name,
          updatedById: admin.userId,
          regions: { set: data.regionSlugs.map((slug) => ({ slug })) },
        },
      })
      await auditRegionLinksChange({
        model: 'ReviewList',
        recordId: id,
        oldRegionSlugs: before?.regions.map((region) => region.slug) ?? [],
        newRegionSlugs: data.regionSlugs,
      })
    })
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren der Prüfliste')
  }
}
