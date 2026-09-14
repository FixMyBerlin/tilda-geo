import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useNotesModeParam } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { parseMapParam } from './utils/mapParam'

/**
 * Compose pin from `notes.new`. Parsing and rounding stay in `parseMapParam` /
 * `serializeMapParam` (same encoding as `map=*`). Kind (OSM vs internal) is region XOR /
 * `showingOsm` from the list, not a URL key.
 */
export const useNotesComposePin = () => {
  const { notesMode, setNotesModeParam } = useNotesModeParam()
  const composePin = notesMode.new ? parseMapParam(notesMode.new) : null

  const clearComposeParams = () => {
    setNotesModeParam({ ...notesMode, new: undefined })
  }

  return {
    composePin,
    isComposing: Boolean(composePin),
    clearComposeParams,
  }
}

/** Bookmark / inspector open: fly the main map to the create-param pin when compose starts or the pin changes. */
export const useFlyMainMapToComposePin = () => {
  const { mainMap } = useMap()
  const { composePin } = useNotesComposePin()
  const zoom = composePin?.zoom
  const lat = composePin?.lat
  const lng = composePin?.lng

  useEffect(
    function flyMainMapToComposePinOnEnter() {
      if (!mainMap || zoom === undefined || lat === undefined || lng === undefined) {
        return
      }
      const center = mainMap.getCenter()
      const currentZoom = mainMap.getZoom()
      const samePlace =
        Math.abs(center.lat - lat) < 1e-5 &&
        Math.abs(center.lng - lng) < 1e-5 &&
        Math.abs(currentZoom - zoom) < 0.05
      if (samePlace) return
      mainMap.flyTo({ center: [lng, lat], zoom })
    },
    [mainMap, zoom, lat, lng],
  )
}
