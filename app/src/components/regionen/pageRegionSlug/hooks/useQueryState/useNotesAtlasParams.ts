import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { parseMapParam, serializeMapParam, type MapParam } from './utils/mapParam'

export const useNewInternalNoteMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const wire = search[searchParamsRegistry.internalNote]
  const newInternalNoteMapParam = wire ? parseMapParam(wire) : null

  const setNewInternalNoteMapParam = (value: MapParam | null) => {
    updateSearch(
      {
        [searchParamsRegistry.internalNote]: value === null ? undefined : serializeMapParam(value),
      },
      { replace: true },
    )
  }

  return { newInternalNoteMapParam, setNewInternalNoteMapParam }
}
