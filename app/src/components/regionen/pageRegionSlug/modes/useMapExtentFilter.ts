import { useMapViewportBbox } from './useMapViewportBbox'

/** The map-extent filter every mode list offers: only items in the current map view, or all. */
export type ModeListExtent = 'view' | 'all'

/**
 * Returns a predicate to filter mode list items by the current map extent.
 * With `extent: 'all'` (or while the map has not reported bounds yet) everything passes.
 * "Current view" is the part of the map that is not covered by the mobile mode dock.
 */
export const useMapExtentFilter = (extent: ModeListExtent) => {
  const viewportBbox = useMapViewportBbox()

  return ([lng, lat]: [number, number]) => {
    if (extent === 'all' || !viewportBbox) return true
    const [minLng, minLat, maxLng, maxLat] = viewportBbox
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
  }
}
