import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderArea } from '../authorizeSpaceFinderRegion.server'
import { refreshAreaCensusStats } from '../censusSaettigung.server'
import { parseVariantFactorConfig } from '../factorConfigSchema'
import { jsonEqualIgnoringKeyOrder } from '../factorFingerprint'
import { syncEigendatenWeights } from '../mergeFactorConfig'
import { markRunsStaleForArea } from '../runStaleness.server'
import { StudyAreaSchema, UserDatasetsSchema } from '../schemas'
import { SpaceFinderUseCaseSchema, spaceFinderTitleSchema } from '../spaceFinderFormSchemas'

export const UpdateAreaInput = z.object({
  areaId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  studyArea: StudyAreaSchema.optional(),
  userDatasets: UserDatasetsSchema,
  useCase: SpaceFinderUseCaseSchema.optional(),
  areaSizeM2: z.number().nullable().optional(),
  markRunsStale: z.boolean().optional(),
})

const jsonEqual = jsonEqualIgnoringKeyOrder

export async function updateSpaceFinderArea(
  data: z.infer<typeof UpdateAreaInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderArea(headers, data.areaId)
  return runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), async () => {
    const existing = await db.spaceFinderArea.findFirstOrThrow({
      where: { id: data.areaId },
      select: {
        studyArea: true,
        userDatasets: true,
        useCase: true,
        areaSizeM2: true,
      },
    })
    const userDatasetsChanged =
      data.userDatasets !== undefined && !jsonEqual(data.userDatasets, existing.userDatasets)
    const areaInputsChanged =
      data.markRunsStale === true ||
      (data.studyArea !== undefined && !jsonEqual(data.studyArea, existing.studyArea)) ||
      userDatasetsChanged ||
      (data.useCase !== undefined && data.useCase !== existing.useCase) ||
      (data.areaSizeM2 !== undefined && data.areaSizeM2 !== existing.areaSizeM2)
    // Datasets added or removed: sync the strengths of all variants (new ones with the
    // initial value, removed ones dropped), otherwise orphaned keys remain in factorConfig.
    if (userDatasetsChanged) {
      const variants = await db.spaceFinderVariant.findMany({
        where: { areaId: data.areaId },
        select: { id: true, factorConfig: true },
      })
      for (const variant of variants) {
        const current = parseVariantFactorConfig(variant.factorConfig)
        const synced = syncEigendatenWeights(current, data.userDatasets)
        if (jsonEqual(synced, current)) continue
        await db.spaceFinderVariant.update({
          where: { id: variant.id },
          data: { factorConfig: synced as Prisma.InputJsonValue },
        })
      }
    }
    const result = await db.spaceFinderArea.update({
      where: { id: data.areaId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.studyArea !== undefined && {
          studyArea: data.studyArea as unknown as Prisma.InputJsonValue,
        }),
        ...(data.userDatasets !== undefined && {
          userDatasets: data.userDatasets as unknown as Prisma.InputJsonValue,
        }),
        ...(data.useCase !== undefined && { useCase: data.useCase }),
        ...(data.areaSizeM2 !== undefined && { areaSizeM2: data.areaSizeM2 }),
        ...(areaInputsChanged && { inputUpdatedAt: new Date() }),
      },
    })
    if (areaInputsChanged) await markRunsStaleForArea(data.areaId)
    // Only the geometry changes the census figures; title, use case or user datasets do not.
    if (data.studyArea !== undefined && !jsonEqual(data.studyArea, existing.studyArea)) {
      await refreshAreaCensusStats(data.areaId, data.studyArea)
    }
    return { id: result.id }
  })
}
