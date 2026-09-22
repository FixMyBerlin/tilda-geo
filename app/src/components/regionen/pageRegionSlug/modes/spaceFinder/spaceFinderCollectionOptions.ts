import { frenchQuote } from '@/components/shared/text/Quotes'
import type { getPlanningAreasFn } from '@/server/planning/planning.functions'

type PlanningAreasRow = Awaited<ReturnType<typeof getPlanningAreasFn>>[number]

export type SpaceFinderCollectionOption = {
  value: string
  label: string
  areaId: number
  areaTitle: string
  variantId: number
  variantTitle: string
}

/**
 * One flat collection option per variant (D4): `Gebiet »…«: Variante »…«`, ordered by Gebiet
 * (oldest first — the server returns `createdAt: desc`, so this re-sorts ascending) and then by
 * variant creation (already ascending from the server).
 */
export const spaceFinderCollectionOptions = (
  areas: readonly PlanningAreasRow[],
): SpaceFinderCollectionOption[] => {
  const sortedAreas = [...areas].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  return sortedAreas.flatMap((area) =>
    area.variants.map((variant) => ({
      value: String(variant.id),
      label: `Gebiet ${frenchQuote(area.title)}: Variante ${frenchQuote(variant.title)}`,
      areaId: area.id,
      areaTitle: area.title,
      variantId: variant.id,
      variantTitle: variant.title,
    })),
  )
}
