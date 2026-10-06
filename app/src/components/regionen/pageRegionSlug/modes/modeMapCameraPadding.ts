import type { MapRef } from 'react-map-gl/maplibre'

/**
 * MapLibre camera padding for region modes on a phone.
 *
 * The mobile dock (Hinweise / QA / Prüflisten) covers the bottom of the map. CSS already
 * lifts zoom/search above it (`--mode-mobile-dock-height`). This file is the camera side:
 * `flyTo` / `fitBounds` treat “center” as the remaining visible canvas, so a pin is not
 * hidden under the sheet. `ModeMobileDock` measures its height and passes it in as px.
 */
export const MODE_MAP_CAMERA_EDGE_INSET_PX = 16

/** Snap (no extra animation) when the dock opens, resizes, or peeks. */
export const applyModeMapCameraPadding = (map: MapRef | undefined, dockHeightPx: number) => {
  const edge = MODE_MAP_CAMERA_EDGE_INSET_PX
  map?.easeTo({
    padding: { top: edge, right: edge, left: edge, bottom: dockHeightPx + edge },
    duration: 0,
  })
}

/** Clear padding when the dock unmounts (back to the default map). */
export const resetModeMapCameraPadding = (map: MapRef | undefined) => {
  map?.easeTo({ padding: { top: 0, right: 0, bottom: 0, left: 0 }, duration: 0 })
}
