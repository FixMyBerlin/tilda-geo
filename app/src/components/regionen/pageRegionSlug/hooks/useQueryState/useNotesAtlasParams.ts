import { useThrottler } from '@tanstack/react-pacer'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { parseMapParam, serializeMapParam, type MapParam } from './utils/mapParam'

export const useShowInternalNotesParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const showInternalNotesParam = search[searchParamsRegistry.atlasNotes]

  const setShowInternalNotesParam = (value: boolean) => {
    // replace + drop the default (false) from the URL (matches old nuqs behavior).
    updateSearch({ [searchParamsRegistry.atlasNotes]: value || undefined }, { replace: true })
  }

  return { showInternalNotesParam, setShowInternalNotesParam }
}

export const useNewInternalNoteMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const wire = search[searchParamsRegistry.atlasNote]
  const newInternalNoteMapParam = wire ? parseMapParam(wire) : null

  const commitPosition = (value: MapParam) => {
    updateSearch({ [searchParamsRegistry.atlasNote]: serializeMapParam(value) }, { replace: true })
  }

  // useThrottler (not useThrottledCallback) so we can cancel the pending trailing write below.
  const positionThrottler = useThrottler(commitPosition, { wait: 1000 })

  const setNewInternalNoteMapParam = (value: MapParam | null) => {
    if (value === null) {
      // Cancel any pending trailing position write, otherwise closing the dialog would re-add the
      // `atlasNote` param ~1s later and re-open the just-closed note.
      positionThrottler.cancel()
      updateSearch({ [searchParamsRegistry.atlasNote]: undefined }, { replace: true })
      return
    }
    positionThrottler.maybeExecute(value)
  }

  return { newInternalNoteMapParam, setNewInternalNoteMapParam }
}

export const useInternalNotesFilterParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const internalNotesFilterParam = search[searchParamsRegistry.atlasNotesFilter]

  const setInternalNotesFilterParam = (value: typeof internalNotesFilterParam) => {
    updateSearch({ [searchParamsRegistry.atlasNotesFilter]: value }, { replace: true })
  }

  return { internalNotesFilterParam, setInternalNotesFilterParam }
}
