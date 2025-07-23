import { useMap } from 'react-map-gl/maplibre'
import { useShowOsmNotesParam } from '../../../_hooks/useQueryState/useNotesOsmParams'

export const useNotesActiveByZoom = () => {
  const { mainMap } = useMap()
  const { showOsmNotesParam } = useShowOsmNotesParam()

  // InternalNotes should be visible always, we load all data anyways
  let minZoomNotesActive = 5
  if (showOsmNotesParam) {
    // OsmNotes however need stonger limit, because the API will only return a limited number of notes and we don't handle this "pagination" well, yet
    minZoomNotesActive = 10
  }

  const currentZoom = mainMap?.getZoom()
  if (!currentZoom) return false

  return currentZoom >= minZoomNotesActive
}
