import type { Map as MaplibreMap } from 'maplibre-gl'
import { useSyncExternalStore } from 'react'
import { useMap } from 'react-map-gl/maplibre'

export type MapNavigationMapId = 'mainMap'

type MapNavigationCamera = {
  zoom: number
  bearing: number
  pitch: number
  roll: number
  minZoom: number
  maxZoom: number
}

const idleCamera = {
  zoom: 0,
  bearing: 0,
  pitch: 0,
  roll: 0,
  minZoom: 0,
  maxZoom: 22,
} satisfies MapNavigationCamera

const cameraCache = new WeakMap<MaplibreMap, MapNavigationCamera>()

const readCamera = (map: MaplibreMap) => {
  const next = {
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    roll: map.getRoll(),
    minZoom: map.getMinZoom(),
    maxZoom: map.getMaxZoom(),
  } satisfies MapNavigationCamera
  const prev = cameraCache.get(map)
  if (
    prev &&
    prev.zoom === next.zoom &&
    prev.bearing === next.bearing &&
    prev.pitch === next.pitch &&
    prev.roll === next.roll &&
    prev.minZoom === next.minZoom &&
    prev.maxZoom === next.maxZoom
  ) {
    return prev
  }
  cameraCache.set(map, next)
  return next
}

const subscribeToNavigationCamera = (map: MaplibreMap, onStoreChange: () => void) => {
  map.on('zoom', onStoreChange)
  map.on('rotate', onStoreChange)
  map.on('pitch', onStoreChange)
  map.on('roll', onStoreChange)
  return function unsubscribeFromNavigationCamera() {
    map.off('zoom', onStoreChange)
    map.off('rotate', onStoreChange)
    map.off('pitch', onStoreChange)
    map.off('roll', onStoreChange)
  }
}

/**
 * Live zoom/bearing/pitch/roll for nav chrome.
 *
 * MapLibre's NavigationControl listens to `zoom` / `rotate` / `pitch` / `roll` (not every
 * `move`). We subscribe the same way via `useSyncExternalStore` so 2D pans do not re-render
 * the buttons. This is not URL/viewport sync — that stays on `<Map onMoveEnd>`.
 */
export const useMapNavigationCamera = (mapId: MapNavigationMapId) => {
  const maps = useMap()
  const mapRef = maps[mapId]
  const map = mapRef?.getMap()

  const camera = useSyncExternalStore(
    (onStoreChange) => {
      if (!map) return () => {}
      return subscribeToNavigationCamera(map, onStoreChange)
    },
    () => (map ? readCamera(map) : idleCamera),
    () => idleCamera,
  )

  return { mapRef, camera }
}
