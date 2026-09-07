import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { internalNotesQueryKey } from '@/server/regions/regionQueryOptions'

/**
 * Invalidation key for the current region's internal-notes queries. Intentionally omits
 * filter so it partial-matches — and thus invalidates — every filter variant.
 */
export const useInternalNotesQueryKey = () => {
  const region = useRegion()
  return [...internalNotesQueryKey, { regionSlug: region.slug }] as const
}
