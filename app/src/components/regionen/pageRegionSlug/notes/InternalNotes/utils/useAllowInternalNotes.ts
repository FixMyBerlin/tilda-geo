import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'

export const useAllowInternalNotes = () => {
  const hasPermissions = useHasPermissions()
  const region = useRegion()
  return region && region.notes === 'internalNotes' && hasPermissions
}
