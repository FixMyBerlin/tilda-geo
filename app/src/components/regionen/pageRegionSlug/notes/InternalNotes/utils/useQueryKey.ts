import { useInternalNotesFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { internalNotesQueryKey } from '@/server/regions/regionQueryOptions'

export const useQueryKey = () => {
  const region = useStaticRegion()
  const { internalNotesFilterParam } = useInternalNotesFilterParam()
  return [
    ...internalNotesQueryKey,
    { regionSlug: region.slug, filter: internalNotesFilterParam },
  ] as const
}
