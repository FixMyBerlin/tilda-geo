import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import {
  parseFactorConfigSnapshot,
  parseVariantFactorConfig,
  VariantFactorConfigSchema,
} from '../factorConfigSchema'
import { runFreshnessAfterFactorSave } from '../factorFingerprint'
import {
  areaInputFromRow,
  keepStoredMinArea,
  stripAutoSaettigung,
  syncEigendatenWeights,
} from '../mergeFactorConfig'
import { markRunsStaleForVariant, markRunsFreshForVariant } from '../runStaleness.server'
import { spaceFinderTitleSchema } from '../spaceFinderFormSchemas'

export const UpdateVariantInput = z.object({
  variantId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  description: z.string().optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
  /** Set only the target size of the area search without sending the rest of factorConfig. */
  minAreaM2: z.number().min(0).nullable().optional(),
})

export async function updateSpaceFinderVariant(
  data: z.infer<typeof UpdateVariantInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderVariant(headers, data.variantId)
  const existing = await db.spaceFinderVariant.findFirstOrThrow({
    where: { id: data.variantId },
    select: {
      factorConfig: true,
      area: {
        select: {
          studyArea: true,
          userDatasets: true,
          useCase: true,
          areaSizeM2: true,
          censusSaettigungEw: true,
          censusEwPerHa: true,
        },
      },
      runs: {
        where: { status: { in: ['COMPLETE', 'EMPTY'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { factorConfigSnapshot: true },
      },
    },
  })
  let factorConfig = data.factorConfig
  if (factorConfig !== undefined && data.minAreaM2 === undefined) {
    factorConfig = keepStoredMinArea(factorConfig, parseVariantFactorConfig(existing.factorConfig))
  }
  if (data.minAreaM2 !== undefined) {
    factorConfig = {
      ...parseVariantFactorConfig(factorConfig ?? existing.factorConfig),
      min_area_m2: data.minAreaM2,
    }
  }
  // Sync with the area's datasets: a draft from before the last area save must not write
  // back strengths of removed datasets.
  const stored =
    factorConfig !== undefined
      ? syncEigendatenWeights(
          stripAutoSaettigung(factorConfig),
          areaInputFromRow(existing.area).userDatasets,
        )
      : undefined
  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.spaceFinderVariant.update({
        where: { id: data.variantId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(stored !== undefined && {
            factorConfig: stored as Prisma.InputJsonValue,
          }),
        },
      }),
  )
  // Title and description do not change the result. `min_area_m2` is a client filter and does
  // not count in `runFreshnessAfterFactorSave`. A save that matches the last run again
  // (discarding changes) clears `stale` — as long as the area still matches.
  if (stored !== undefined) {
    const snapshot = existing.runs[0]
      ? parseFactorConfigSnapshot(existing.runs[0].factorConfigSnapshot)
      : null
    const freshness = runFreshnessAfterFactorSave(stored, areaInputFromRow(existing.area), snapshot)
    if (freshness === 'stale') await markRunsStaleForVariant(data.variantId)
    if (freshness === 'fresh') await markRunsFreshForVariant(data.variantId)
  }
  return { id: result.id, areaId: result.areaId }
}
