import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { getRegionModalAccess } from './regionModalAccess'

export const useRegionModalAccess = () => {
  const { region } = useRegionLoaderData()
  const hasPermissions = useHasPermissions()

  return getRegionModalAccess(region, hasPermissions)
}
