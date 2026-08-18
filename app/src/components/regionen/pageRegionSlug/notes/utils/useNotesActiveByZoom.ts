import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useShowOsmNotesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'

export const useNotesActiveByZoom = () => {
  const { mapParam } = useMapParam()
  const { showOsmNotesParam } = useShowOsmNotesParam()

  // InternalNotes should be visible always, we load all data anyways
  let minZoomNotesActive = 5
  if (showOsmNotesParam) {
    // OsmNotes however need stonger limit, because the API will only return a limited number of notes and we don't handle this "pagination" well, yet
    minZoomNotesActive = 10
  }

  // URL map param updates on move end and is available before the MapLibre instance is ready.
  // `mainMap.getZoom()` is not reactive and left controls stuck on the "zoom in" state.
  return mapParam.zoom >= minZoomNotesActive
}
