import type { getPlanningAreasFn } from '@/server/planning/planning.functions'

export type PlanningAreasRow = Awaited<ReturnType<typeof getPlanningAreasFn>>[number]
export type PlanningAreaVariantRow = PlanningAreasRow['variants'][number]

/** The active Planungsgebiet + Variante, resolved from `ff.key` (a variant id). */
export type SpaceFinderSelectedVariant = {
  areaId: number
  areaTitle: string
  variantId: number
  variantTitle: string
  /** Number of variants in the selected Gebiet (the last one cannot be deleted). */
  variantCount: number
}

/**
 * Planungsgebiete for the header collection, oldest first — the server returns `createdAt: desc`.
 * Their variants already come ascending by creation from the server.
 */
export const sortedSpaceFinderAreas = (areas: readonly PlanningAreasRow[]) =>
  [...areas].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

/** Resolves the variant id from the URL to its Gebiet; `undefined` if it no longer exists. */
export const spaceFinderSelectedVariant = (
  areas: readonly PlanningAreasRow[],
  variantId: number | null | undefined,
): SpaceFinderSelectedVariant | undefined => {
  if (variantId == null) return undefined
  for (const area of areas) {
    const variant = area.variants.find((v) => v.id === variantId)
    if (variant) {
      return {
        areaId: area.id,
        areaTitle: area.title,
        variantId: variant.id,
        variantTitle: variant.title,
        variantCount: area.variants.length,
      }
    }
  }
  return undefined
}

/** First variant of the oldest Gebiet that has one — the implicit selection. */
export const firstSpaceFinderVariantId = (areas: readonly PlanningAreasRow[]) =>
  sortedSpaceFinderAreas(areas).find((area) => area.variants.length > 0)?.variants[0]?.id

export type SpaceFinderVariantStatus = 'running' | 'stale' | 'complete' | 'none'

/** Run state of a variant for the Varianten dropdown; mirrors the status line in the panel body. */
export const spaceFinderVariantStatus = (
  variant: Pick<PlanningAreaVariantRow, 'currentRunId' | 'jobs' | 'runs'>,
): SpaceFinderVariantStatus => {
  const jobStatus = variant.jobs[0]?.status
  if (jobStatus === 'QUEUED' || jobStatus === 'RUNNING') return 'running'
  const latestRun = variant.runs[0]
  if (latestRun?.status === 'COMPLETE' && latestRun.stale) return 'stale'
  if (variant.currentRunId != null) return 'complete'
  return 'none'
}
