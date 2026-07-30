import { useInternalNotesFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { internalNotesQueryKey } from '@/server/regions/regionQueryOptions'

export const useQueryKey = () => {
  const region = useRegion()
  const { internalNotesFilterParam } = useInternalNotesFilterParam()
  return [
    ...internalNotesQueryKey,
    { regionSlug: region.slug, filter: internalNotesFilterParam },
  ] as const
}
