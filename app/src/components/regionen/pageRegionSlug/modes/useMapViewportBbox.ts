import { useMap } from 'react-map-gl/maplibre'
import { useMapBounds } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'

export const MODE_VIEWPORT_BBOX_PADDING_PX = 10

const roundCoord = (value: number) => Math.round(value * 10_000) / 10_000

const roundBbox = (bbox: readonly [number, number, number, number]) =>
  [roundCoord(bbox[0]), roundCoord(bbox[1]), roundCoord(bbox[2]), roundCoord(bbox[3])] satisfies [
    number,
    number,
    number,
    number,
  ]

// Padding must never eat the whole canvas on a very small map.
export const clampViewportPadding = (
  width: number,
  height: number,
  pad = MODE_VIEWPORT_BBOX_PADDING_PX,
) => Math.max(0, Math.min(pad, Math.floor(Math.min(width, height) / 4)))

export const paddedViewportBbox = ({
  width,
  height,
  corners,
  clampTo,
}: {
  width: number
  height: number
  corners: readonly { lng: number; lat: number }[]
  clampTo: readonly [number, number, number, number]
}) => {
  const roundedClamp = roundBbox(clampTo)

  if (width <= 0 || height <= 0 || corners.length < 2) {
    return roundedClamp
  }

  if (corners.some((corner) => !Number.isFinite(corner.lng) || !Number.isFinite(corner.lat))) {
    return roundedClamp
  }

  const lngs = corners.map((corner) => corner.lng)
  const lats = corners.map((corner) => corner.lat)
  const minLng = Math.max(Math.min(...lngs), clampTo[0])
  const minLat = Math.max(Math.min(...lats), clampTo[1])
  const maxLng = Math.min(Math.max(...lngs), clampTo[2])
  const maxLat = Math.min(Math.max(...lats), clampTo[3])

  if (minLng >= maxLng || minLat >= maxLat) {
    return roundedClamp
  }

  return [
    roundCoord(minLng),
    roundCoord(minLat),
    roundCoord(maxLng),
    roundCoord(maxLat),
  ] satisfies [number, number, number, number]
}

type ViewportInsets = { top: number; right: number; bottom: number; left: number }

/**
 * Pixel insets of the part of the canvas that counts as "the current view": the small list
 * padding, or the map's camera padding where that is larger (the mobile mode dock covers the
 * bottom of the map, see `modeMapCameraPadding.ts`). Falls back to the list padding when the
 * camera padding leaves nothing visible.
 */
export const viewportInsets = (
  width: number,
  height: number,
  cameraPadding: Partial<ViewportInsets>,
) => {
  const pad = clampViewportPadding(width, height)
  const insets = {
    top: Math.max(pad, cameraPadding.top ?? 0),
    right: Math.max(pad, cameraPadding.right ?? 0),
    bottom: Math.max(pad, cameraPadding.bottom ?? 0),
    left: Math.max(pad, cameraPadding.left ?? 0),
  } satisfies ViewportInsets
  if (insets.left + insets.right >= width || insets.top + insets.bottom >= height) {
    return { top: pad, right: pad, bottom: pad, left: pad } satisfies ViewportInsets
  }
  return insets
}

export const useMapViewportBbox = () => {
  const mapBounds = useMapBounds()
  const { mainMap } = useMap()
  if (!mainMap || !mapBounds) return undefined

  const canvas = mainMap.getCanvas()
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  const { top, right, bottom, left } = viewportInsets(width, height, mainMap.getPadding())

  // All four corners: two opposite corners under-cover a rotated view.
  const corners = [
    mainMap.unproject([left, top]),
    mainMap.unproject([width - right, top]),
    mainMap.unproject([width - right, height - bottom]),
    mainMap.unproject([left, height - bottom]),
  ]

  // Clamping to mapBounds keeps pitched unprojections (horizon) from exploding;
  // getBounds() is a safe superset, so no bearing/pitch branch is needed.
  return paddedViewportBbox({
    width,
    height,
    corners,
    clampTo: [mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()],
  })
}
