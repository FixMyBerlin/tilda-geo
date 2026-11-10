import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
} from '@/server/space-finder/factorFingerprint'
import { areaInputFromRow } from '@/server/space-finder/mergeFactorConfig'
import {
  type SpaceFinderVariantStatus,
  spaceFinderVariantStatus,
} from './collection/spaceFinderCollectionOptions'
import type { SpaceFinderVariantDetail } from './spaceFinderVariantDetail'

/** Status of the open variant, including unsaved factor and area drift the list row does not have. */
export const spaceFinderOpenRunStatus = (variant: SpaceFinderVariantDetail) => {
  const latestJob = variant.jobs[0] ?? null
  const latestRun = variant.runs[0] ?? null
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  const comparableSnapshot = comparableRunSnapshot(
    hasCompleteRun ? (latestRun?.factorConfigSnapshot ?? null) : null,
    areaInputFromRow(variant.area),
  )
  const factorsChanged = hasCompleteRun && factorsDiffer(variant.factorConfig, comparableSnapshot)
  const areaChanged =
    hasCompleteRun &&
    areaInputsDiffer(variant.factorConfig, latestRun?.factorConfigSnapshot ?? null)
  const status: SpaceFinderVariantStatus = spaceFinderVariantStatus(variant, {
    outdated: factorsChanged || areaChanged,
  })
  return {
    status,
    outdatedReason: status === 'stale' ? outdatedBannerReason(factorsChanged, areaChanged) : null,
    latestJob,
    latestRun,
    hasCompleteRun,
  }
}
