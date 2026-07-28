import { create } from 'zustand'
import type { GeoFeature } from './useGeocodingSearch'

type SearchResultStore = {
  /** The currently picked geocoding result whose geometry is drawn on the map (null = none). */
  feature: GeoFeature | null
  setFeature: (feature: GeoFeature | null) => void
}

/**
 * Bridges the picked search result from the search UI (rendered in the header /
 * a map overlay, outside `<Map>`) to the geometry layers (rendered inside
 * `<Map>` in RegionMap). Lets us draw the result with react-map-gl Source/Layer
 * instead of imperative map.addSource/addLayer.
 */
export const useSearchResultStore = create<SearchResultStore>((set) => ({
  feature: null,
  setFeature: (feature) => set({ feature }),
}))
