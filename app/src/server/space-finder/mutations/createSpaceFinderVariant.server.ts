import { z } from 'zod'
import { StoredUserDatasetsSchema } from '@/lib/spaceFinderUserGeojson'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderArea } from '../authorizeSpaceFinderRegion.server'
import { VariantFactorConfigSchema } from '../factorConfigSchema'
import { stripAutoSaettigung, syncEigendatenWeights } from '../mergeFactorConfig'
import { spaceFinderTitleSchema } from '../spaceFinderFormSchemas'

export const CreateVariantInput = z.object({
  areaId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a new variant on an existing planungsgebiet (e.g. after all variants were deleted). */
export async function createSpaceFinderVariant(
  data: z.infer<typeof CreateVariantInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderArea(headers, data.areaId)
  const [variantCount, area] = await Promise.all([
    db.spaceFinderVariant.count({ where: { areaId: data.areaId } }),
    db.spaceFinderArea.findFirstOrThrow({
      where: { id: data.areaId },
      select: { userDatasets: true, areaSizeM2: true },
    }),
  ])
  const userDatasets = StoredUserDatasetsSchema.parse(area.userDatasets)
  // Like the first variant from the wizard: the Planungsgebiet's area size prefills the area
  // search, unless the caller sets one.
  const factorConfig = {
    ...data.factorConfig,
    min_area_m2: data.factorConfig?.min_area_m2 ?? area.areaSizeM2,
  }
  const created = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.spaceFinderVariant.create({
        data: {
          areaId: data.areaId,
          createdById: session.userId,
          title: data.title ?? `Variante ${variantCount + 1}`,
          factorConfig: syncEigendatenWeights(
            stripAutoSaettigung(factorConfig),
            userDatasets,
          ) as Prisma.InputJsonValue,
        },
      }),
  )
  return { id: created.id, areaId: created.areaId }
}
