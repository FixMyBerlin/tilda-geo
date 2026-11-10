import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'
import { refreshAreaCensusStats } from '../censusSaettigung.server'
import { VariantFactorConfigSchema } from '../factorConfigSchema'
import { stripAutoSaettigung, syncEigendatenWeights } from '../mergeFactorConfig'
import { AreaGeometryInputSchema } from '../schemas'
import { SpaceFinderUseCaseSchema, spaceFinderTitleSchema } from '../spaceFinderFormSchemas'

export const CreateAreaInput = z.object({
  regionSlug: z.string(),
  title: spaceFinderTitleSchema,
  ...AreaGeometryInputSchema.shape,
  useCase: SpaceFinderUseCaseSchema.optional(),
  areaSizeM2: z.number().nullable().optional(),
  variantTitle: spaceFinderTitleSchema.optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a Planungsgebiet and its first variant (no auto-run). */
export async function createSpaceFinderArea(
  data: z.infer<typeof CreateAreaInput>,
  headers: Headers,
) {
  const session = await requireAuth(headers)
  await authorizeSpaceFinderRegion(session, data.regionSlug)
  const regionId = await getRegionIdBySlug(data.regionSlug)
  return runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), async () => {
    // Two creates instead of a nested `variants: { create }`: the audit extension only logs the
    // top-level model, so a nested variant would get no CREATE row.
    const { area, variant } = await db.$transaction(async (tx) => {
      const area = await tx.spaceFinderArea.create({
        data: {
          regionId,
          createdById: session.userId,
          title: data.title,
          studyArea: data.studyArea as unknown as Prisma.InputJsonValue,
          userDatasets: (data.userDatasets ?? []) as unknown as Prisma.InputJsonValue,
          useCase: data.useCase ?? 'fahrradbox',
          areaSizeM2: data.areaSizeM2 ?? null,
        },
      })
      const variant = await tx.spaceFinderVariant.create({
        data: {
          areaId: area.id,
          createdById: session.userId,
          title: data.variantTitle ?? 'Variante 1',
          factorConfig: syncEigendatenWeights(
            stripAutoSaettigung(data.factorConfig ?? {}),
            data.userDatasets,
          ) as Prisma.InputJsonValue,
        },
      })
      return { area, variant }
    })
    await refreshAreaCensusStats(area.id, data.studyArea)
    return { areaId: area.id, variantId: variant.id }
  })
}
