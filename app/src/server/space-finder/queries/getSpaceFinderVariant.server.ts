import { z } from 'zod'
import { StoredUserDatasetsSchema } from '@/lib/spaceFinderUserGeojson'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import { ensureAreaCensusStats } from '../censusSaettigung.server'
import { parseFactorConfigSnapshot, parseVariantFactorConfig } from '../factorConfigSchema'
import { areaInputFromRow, mergeFactorConfig } from '../mergeFactorConfig'
import { checkParkingDataAvailable } from '../parkingDataAvailability.server'
import { VariantIdInput } from '../schemas'

export async function getSpaceFinderVariant(
  data: z.infer<typeof VariantIdInput>,
  headers: Headers,
) {
  await authorizeSpaceFinderVariant(headers, data.variantId)
  const variant = await db.spaceFinderVariant.findFirstOrThrow({
    where: { id: data.variantId },
    include: {
      area: {
        select: {
          id: true,
          title: true,
          studyArea: true,
          userDatasets: true,
          useCase: true,
          areaSizeM2: true,
          censusSaettigungEw: true,
          censusEwPerHa: true,
          inputUpdatedAt: true,
        },
      },
      createdBy: { select: { id: true, osmName: true } },
      runs: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          hexCount: true,
          vegCount: true,
          stale: true,
          createdAt: true,
          cirAttribution: true,
          factorConfigSnapshot: true,
        },
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, errorMessage: true, resultRunId: true },
      },
    },
  })
  // Areas created before the census suggestion existed backfill it here once — the factor
  // editor depends on this query, so this is where the value is needed.
  const stats = await ensureAreaCensusStats(variant.areaId)
  const area = {
    ...variant.area,
    userDatasets: StoredUserDatasetsSchema.parse(variant.area.userDatasets),
    ...(stats && { censusSaettigungEw: stats.saettigungEw, censusEwPerHa: stats.ewPerHa }),
  }
  const factorConfig = mergeFactorConfig(
    areaInputFromRow(area),
    parseVariantFactorConfig(variant.factorConfig),
  )
  const parkingDataAvailable = await checkParkingDataAvailable(area.studyArea)
  return {
    ...variant,
    area,
    factorConfig,
    parkingDataAvailable,
    runs: variant.runs.map((run) => ({
      ...run,
      factorConfigSnapshot: parseFactorConfigSnapshot(run.factorConfigSnapshot),
    })),
  }
}
