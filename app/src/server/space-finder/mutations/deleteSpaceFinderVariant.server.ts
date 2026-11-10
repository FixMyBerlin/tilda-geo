import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import { deleteVariantPostgisResults } from '../deleteVariantResults.server'
import { VariantIdInput } from '../schemas'

export async function deleteSpaceFinderVariant(
  data: z.infer<typeof VariantIdInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderVariant(headers, data.variantId)
  // A Planungsgebiet always keeps at least one variant: the mode selects by variant id.
  const { areaId } = await db.spaceFinderVariant.findUniqueOrThrow({
    where: { id: data.variantId },
    select: { areaId: true },
  })
  const variantCount = await db.spaceFinderVariant.count({ where: { areaId } })
  if (variantCount <= 1) {
    throw new Error('Ein Planungsgebiet braucht mindestens eine Variante.')
  }
  await deleteVariantPostgisResults(data.variantId)
  await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
    db.spaceFinderVariant.delete({ where: { id: data.variantId } }),
  )
}
