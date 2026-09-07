import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { parseMapParam, serializeMapParam, type MapParam } from './utils/mapParam'

export const useNewOsmNoteMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const wire = search[searchParamsRegistry.osmNote]
  const newOsmNoteMapParam = wire ? parseMapParam(wire) : null

  const setNewOsmNoteMapParam = (value: MapParam | null) => {
    updateSearch(
      {
        [searchParamsRegistry.osmNote]: value === null ? undefined : serializeMapParam(value),
      },
      { replace: true },
    )
  }

  return { newOsmNoteMapParam, setNewOsmNoteMapParam }
}
