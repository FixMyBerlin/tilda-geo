import type { getPlanningAreasFn } from '@/server/planning/planning.functions'

export type PlanningAreasRow = Awaited<ReturnType<typeof getPlanningAreasFn>>[number]
export type PlanningAreaVariantRow = PlanningAreasRow['variants'][number]

/** The active Planungsgebiet + Variante, resolved from `space.key` (a variant id). */
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
) => {
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

/** List row plus the loaded variant. Titles prefer the variant so the header matches the body. */
type SpaceFinderActiveSelection = SpaceFinderSelectedVariant & {
  area: PlanningAreasRow
}

/**
 * One selection for the title, the menus, and the body. The list resolves which Gebiet the URL
 * key belongs to. Once that variant's detail is loaded, its titles win — a rename then cannot
 * leave the header on the list and the form on the detail.
 */
export const spaceFinderActiveSelection = (
  areas: readonly PlanningAreasRow[],
  variantId: number | null | undefined,
  variant: { id: number; title: string; area: { id: number; title: string } } | undefined,
) => {
  const selected = spaceFinderSelectedVariant(areas, variantId)
  if (!selected) return undefined
  const area = areas.find((candidate) => candidate.id === selected.areaId)
  if (!area) return undefined
  const detail = variant != null && variant.id === selected.variantId ? variant : undefined
  return {
    ...selected,
    areaId: detail?.area.id ?? selected.areaId,
    areaTitle: detail?.area.title ?? selected.areaTitle,
    variantTitle: detail?.title ?? selected.variantTitle,
    area,
  } satisfies SpaceFinderActiveSelection
}

/** First variant of the oldest Gebiet that has one — the implicit selection. */
export const firstSpaceFinderVariantId = (areas: readonly PlanningAreasRow[]) =>
  sortedSpaceFinderAreas(areas).find((area) => area.variants.length > 0)?.variants[0]?.id

/**
 * Variant the Flächenfinder loader should prefetch. A key that is still in the list wins.
 * A missing or deleted key warms the same variant the page will write into the URL; the loader
 * does not redirect, because the create wizard may own the selection (`space.new`).
 */
export const spaceFinderVariantIdToPrime = (
  areas: readonly PlanningAreasRow[],
  key: number | undefined,
) => {
  if (key != null && spaceFinderSelectedVariant(areas, key)) return key
  return firstSpaceFinderVariantId(areas)
}

export type SpaceFinderVariantStatus = 'running' | 'stale' | 'complete' | 'none'

/**
 * Run state shared by the Varianten dropdown, the status line, and the run button.
 * `outdated` is the live factor/area drift of the open variant; list rows only have `runs[].stale`.
 */
export const spaceFinderVariantStatus = (
  variant: Pick<PlanningAreaVariantRow, 'currentRunId' | 'jobs' | 'runs'>,
  options?: { outdated?: boolean },
) => {
  const jobStatus = variant.jobs[0]?.status
  if (jobStatus === 'QUEUED' || jobStatus === 'RUNNING') return 'running'
  const latestRun = variant.runs[0]
  // No finished run means nothing can be out of date — a missing snapshot must not count as drift.
  if (latestRun?.status === 'COMPLETE' && (options?.outdated || latestRun.stale)) return 'stale'
  if (variant.currentRunId != null || latestRun?.status === 'COMPLETE') return 'complete'
  return 'none'
}

/**
 * `complete` means the factors still match the latest run (drift would make it `stale`). A failed
 * last job still offers a rerun, so it does not count as up to date.
 */
export const spaceFinderRunUpToDate = (
  status: SpaceFinderVariantStatus,
  jobStatus?: string | null,
) => status === 'complete' && jobStatus !== 'FAILED'

/** A finished or failed attempt offers »Neu berechnen«; a variant that never ran offers »Berechnung starten«. */
export const spaceFinderRunNeedsRerun = (
  status: SpaceFinderVariantStatus,
  jobStatus?: string | null,
) => status === 'complete' || status === 'stale' || jobStatus === 'DONE' || jobStatus === 'FAILED'
