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

export const useMapViewportBbox = () => {
  const mapBounds = useMapBounds()
  const { mainMap } = useMap()
  if (!mainMap || !mapBounds) return undefined

  const canvas = mainMap.getCanvas()
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  const pad = clampViewportPadding(width, height)

  // All four corners: two opposite corners under-cover a rotated view.
  const corners = [
    mainMap.unproject([pad, pad]),
    mainMap.unproject([width - pad, pad]),
    mainMap.unproject([width - pad, height - pad]),
    mainMap.unproject([pad, height - pad]),
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
