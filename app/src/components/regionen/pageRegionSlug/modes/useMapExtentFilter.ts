import { useMapViewportBbox } from './useMapViewportBbox'

/** The map-extent filter every mode list offers: only items in the current map view, or all. */
export type ModeListExtent = 'view' | 'all'

type Bbox = readonly [minLng: number, minLat: number, maxLng: number, maxLat: number]

/** A point as a zero-size bbox, for point-based mode lists. */
export const pointBbox = ([lng, lat]: readonly [number, number]) =>
  [lng, lat, lng, lat] satisfies Bbox

/**
 * True when two bboxes share at least one point (touching edges count). QA mode applies the same
 * rule on the server with PostGIS `&&` (`getQaAreaList.server.ts`), so all mode lists agree.
 */
export const bboxesOverlap = (a: Bbox, b: Bbox) =>
  a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]

/**
 * Returns a predicate to filter mode list items by the current map extent. An item passes when
 * its bbox overlaps the view, so a line counts as soon as any part of its bbox is visible; a
 * point passes its position as a zero-size bbox.
 * With `extent: 'all'` (or while the map has not reported bounds yet) everything passes.
 * "Current view" is the part of the map that is not covered by the mobile mode dock.
 */
export const useMapExtentFilter = (extent: ModeListExtent) => {
  const viewportBbox = useMapViewportBbox()

  return (itemBbox: Bbox) => {
    if (extent === 'all' || !viewportBbox) return true
    return bboxesOverlap(itemBbox, viewportBbox)
  }
}
