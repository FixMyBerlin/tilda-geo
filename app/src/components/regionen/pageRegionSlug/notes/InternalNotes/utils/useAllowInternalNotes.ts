import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'

export const useAllowInternalNotes = () => {
  const hasPermissions = useHasPermissions()
  const region = useStaticRegion()
  return region && region.notes === 'atlasNotes' && hasPermissions
}
