import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderArea } from '../authorizeSpaceFinderRegion.server'
import { deleteVariantPostgisResults } from '../deleteVariantResults.server'
import { AreaIdInput } from '../schemas'

export async function deleteSpaceFinderArea(data: z.infer<typeof AreaIdInput>, headers: Headers) {
  const session = await authorizeSpaceFinderArea(headers, data.areaId)
  const variants = await db.spaceFinderVariant.findMany({
    where: { areaId: data.areaId },
    select: { id: true },
  })
  for (const v of variants) await deleteVariantPostgisResults(v.id)
  await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
    db.spaceFinderArea.delete({ where: { id: data.areaId } }),
  )
}
