import { useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { edgeMarkerCenterInset, listHoverMarkerPosition } from './mapListHoverMarkerPosition'
import { useHoveredListItem, useHoveredMapViewEpoch } from './mode-list-store'

/**
 * Projects the hovered list row's `[lng, lat]` onto the current map viewport.
 * Does not look up map features. In-view: Marker sits on the list point. Off-screen:
 * clamp to the container edge and unproject so the Marker stays on-canvas.
 */
export const useListHoverMarkerPosition = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const hoveredListItem = useHoveredListItem()
  // Subscribe to camera/resize so pan/zoom re-projects the hovered item (epoch starts at 0).
  useHoveredMapViewEpoch()

  if (!mainMap || !mapLoaded || !hoveredListItem) return null

  const container = mainMap.getContainer()
  // Before the map has a real size, width/height are 0 so almost any projection looks `atEdge`.
  if (container.clientWidth === 0 || container.clientHeight === 0) return null

  const projected = mainMap.project(hoveredListItem.coordinates)
  if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) return null

  const screen = listHoverMarkerPosition(
    projected,
    { width: container.clientWidth, height: container.clientHeight },
    edgeMarkerCenterInset(),
  )

  if (!screen.atEdge) {
    return {
      ...screen,
      longitude: hoveredListItem.coordinates[0],
      latitude: hoveredListItem.coordinates[1],
    }
  }

  const lngLat = mainMap.unproject([screen.x, screen.y])
  return {
    ...screen,
    longitude: lngLat.lng,
    latitude: lngLat.lat,
  }
}
