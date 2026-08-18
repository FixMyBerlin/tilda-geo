import type { RegionDialogParam } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useDialogParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const dialog = search[searchParamsRegistry.dialog]

  const setRegionDialog = (value: RegionDialogParam | undefined) => {
    updateSearch({ [searchParamsRegistry.dialog]: value }, { replace: true })
  }

  return { dialog, setRegionDialog }
}
