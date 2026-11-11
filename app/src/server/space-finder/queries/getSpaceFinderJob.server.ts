import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'
import { parseVariantFactorConfig } from '../factorConfigSchema'
import { areaInputFromRow, mergeFactorConfig } from '../mergeFactorConfig'
import { JobIdInput } from '../schemas'

export async function getSpaceFinderJob(data: z.infer<typeof JobIdInput>, headers: Headers) {
  const job = await db.spaceFinderJob.findFirstOrThrow({
    where: { id: data.jobId },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      variantId: true,
      resultRunId: true,
      progress: true,
      progressLabel: true,
      variant: {
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
              region: { select: { slug: true } },
            },
          },
        },
      },
    },
  })
  const session = await requireAuth(headers)
  await authorizeSpaceFinderRegion(session, job.variant.area.region.slug)
  const fc = mergeFactorConfig(
    areaInputFromRow(job.variant.area),
    parseVariantFactorConfig(job.variant.factorConfig),
  )
  return {
    id: job.id,
    status: job.status,
    errorMessage: job.errorMessage,
    variantId: job.variantId,
    resultRunId: job.resultRunId,
    progress: job.progress,
    progressLabel: job.progressLabel,
    weights: (fc.weights ?? {}) as Record<string, number>,
    hasUserDatasets: (fc.user_datasets?.length ?? 0) > 0,
    excludeCarriageways: fc.exclude_carriageways === true,
  }
}
