import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useNotesSelection } from './useNotesSelection'

export const useNotesActiveByZoom = () => {
  const { mapParam } = useMapParam()
  const currentMode = useCurrentMode()
  const selection = useNotesSelection()

  // InternalNotes should be visible always, we load all data anyways
  let minZoomNotesActive = 5
  if (currentMode.isNotes && selection.kind === 'osm') {
    // OsmNotes however need stonger limit, because the API will only return a limited number of notes and we don't handle this "pagination" well, yet
    minZoomNotesActive = 10
  }

  // URL map param updates on move end and is available before the MapLibre instance is ready.
  // `mainMap.getZoom()` is not reactive and left controls stuck on the "zoom in" state.
  return mapParam.zoom >= minZoomNotesActive
}
