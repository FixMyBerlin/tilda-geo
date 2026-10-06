import { useMapBounds } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'

/** The map-extent filter every mode list offers: only items in the current map view, or all. */
export type ModeListExtent = 'view' | 'all'

/**
 * Returns a predicate to filter mode list items by the current map extent.
 * With `extent: 'all'` (or while the map has not reported bounds yet) everything passes.
 */
export const useMapExtentFilter = (extent: ModeListExtent) => {
  const mapBounds = useMapBounds()

  return (coordinates: [number, number]) => {
    if (extent === 'all' || !mapBounds) return true
    return mapBounds.contains(coordinates)
  }
}
