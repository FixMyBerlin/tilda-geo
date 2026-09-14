import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useNewInternalNoteMapParam } from './useNewInternalNoteMapParam'
import { useNewOsmNoteMapParam } from './useNotesOsmParams'

/**
 * Compose pin from `osmNote` or `internalNote`. Parsing and rounding stay in
 * `parseMapParam` / `serializeMapParam` (same encoding as `map=*`) via the per-key readers.
 */
export const useNotesComposePin = () => {
  const { newOsmNoteMapParam, setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const composePin = newOsmNoteMapParam ?? newInternalNoteMapParam
  const composingOsm = Boolean(newOsmNoteMapParam)
  const composingInternal = Boolean(newInternalNoteMapParam)

  const clearComposeParams = () => {
    setNewOsmNoteMapParam(null)
    setNewInternalNoteMapParam(null)
  }

  return {
    composePin,
    composingOsm,
    isComposing: composingOsm || composingInternal,
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
