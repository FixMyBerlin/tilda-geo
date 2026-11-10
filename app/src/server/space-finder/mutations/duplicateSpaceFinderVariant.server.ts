import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import { VariantIdInput } from '../schemas'

export async function duplicateSpaceFinderVariant(
  data: z.infer<typeof VariantIdInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderVariant(headers, data.variantId)
  const source = await db.spaceFinderVariant.findFirstOrThrow({
    where: { id: data.variantId },
    select: { areaId: true, title: true, factorConfig: true },
  })
  const created = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.spaceFinderVariant.create({
        data: {
          areaId: source.areaId,
          createdById: session.userId,
          parentId: data.variantId,
          title: `${source.title} (Kopie)`,
          factorConfig: source.factorConfig as Prisma.InputJsonValue,
        },
      }),
  )
  return { id: created.id, areaId: created.areaId }
}
