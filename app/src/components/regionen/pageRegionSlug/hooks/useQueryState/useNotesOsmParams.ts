import { useThrottler } from '@tanstack/react-pacer'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import { parseMapParam, serializeMapParam, type MapParam } from './utils/mapParam'

export const useShowOsmNotesParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const showOsmNotesParam = search[searchParamsRegistry.osmNotes]

  const setShowOsmNotesParam = (value: boolean) => {
    // replace: toggling a layer should not add a browser-history entry (matches the old nuqs
    // default). `|| undefined` keeps the default (false) out of the URL (clearOnDefault parity).
    updateSearch({ [searchParamsRegistry.osmNotes]: value || undefined }, { replace: true })
  }

  return { showOsmNotesParam, setShowOsmNotesParam }
}

export const useNewOsmNoteMapParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const wire = search[searchParamsRegistry.osmNote]
  const newOsmNoteMapParam = wire ? parseMapParam(wire) : null

  const commitPosition = (value: MapParam) => {
    updateSearch({ [searchParamsRegistry.osmNote]: serializeMapParam(value) }, { replace: true })
  }

  // useThrottler (not useThrottledCallback) so we can cancel the pending trailing write below.
  const positionThrottler = useThrottler(commitPosition, { wait: 1000 })

  const setNewOsmNoteMapParam = (value: MapParam | null) => {
    if (value === null) {
      // Cancel any pending trailing position write, otherwise closing the dialog would re-add the
      // `osmNote` param ~1s later and re-open the just-closed note.
      positionThrottler.cancel()
      updateSearch({ [searchParamsRegistry.osmNote]: undefined }, { replace: true })
      return
    }
    positionThrottler.maybeExecute(value)
  }

  return { newOsmNoteMapParam, setNewOsmNoteMapParam }
}

export const useOsmFilterParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const osmNotesFilterParam = search[searchParamsRegistry.osmNotesFilter]

  const setOsmNotesFilterParam = (value: typeof osmNotesFilterParam) => {
    updateSearch({ [searchParamsRegistry.osmNotesFilter]: value }, { replace: true })
  }

  return { osmNotesFilterParam, setOsmNotesFilterParam }
}
