import type { LngLatBounds } from 'maplibre-gl'
import type { MapRef } from 'react-map-gl/maplibre'
import { MODE_MAP_CAMERA_EDGE_INSET_PX } from './modeMapCameraPadding'

export const isPointOffscreen = (bounds: LngLatBounds, coordinates: [number, number]) =>
  !bounds.contains(coordinates)

/** True when the box does not overlap the map view at all. */
export const isBboxOffscreen = (bounds: LngLatBounds, bbox: [number, number, number, number]) => {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return (
    maxLng < bounds.getWest() ||
    minLng > bounds.getEast() ||
    maxLat < bounds.getSouth() ||
    minLat > bounds.getNorth()
  )
}

const asBbox = (target: [number, number] | [number, number, number, number]) =>
  (target.length === 2 ? [target[0], target[1], target[0], target[1]] : target) satisfies [
    number,
    number,
    number,
    number,
  ]

/**
 * When the point or bbox is fully outside the current view, fly so it fits.
 * Never zooms in; zooms out only if the bbox is larger than the current view.
 */
export const flyMapToIfOffscreen = (
  map: MapRef | undefined,
  target: [number, number] | [number, number, number, number],
) => {
  const bounds = map?.getBounds()
  if (!map || !bounds) return
  const bbox = asBbox(target)
  if (!isBboxOffscreen(bounds, bbox)) return

  const [minLng, minLat, maxLng, maxLat] = bbox
  const currentZoom = map.getZoom()
  const camera = map.cameraForBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: MODE_MAP_CAMERA_EDGE_INSET_PX },
  )
  if (!camera?.center) {
    map.flyTo({ center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] })
    return
  }
  const zoom = typeof camera.zoom === 'number' ? Math.min(currentZoom, camera.zoom) : currentZoom
  map.flyTo({ center: camera.center, zoom })
}
