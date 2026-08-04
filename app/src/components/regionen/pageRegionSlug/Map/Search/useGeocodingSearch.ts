import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import bbox from '@turf/bbox'
import type { Geometry } from 'geojson'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useDebouncedValue } from '@/components/shared/hooks/useDebouncedValue'
import { MAPTILER_API_KEY } from '../utils/maptilerApiKey.const'
import { useSearchResultStore } from './useSearchResultStore'

/** MapTiler geocoding place types (machine values). Used to pick the result icon. */
export type PlaceType =
  | 'continental_marine'
  | 'country'
  | 'major_landform'
  | 'region'
  | 'subregion'
  | 'county'
  | 'joint_municipality'
  | 'joint_submunicipality'
  | 'municipality'
  | 'municipal_district'
  | 'locality'
  | 'neighbourhood'
  | 'place'
  | 'postal_code'
  | 'address'
  | 'road'
  | 'poi'

export type GeoFeature = {
  id: string
  /** Primary name, e.g. "Oranienburg". */
  text?: string
  /** Full label incl. context, e.g. "Oranienburg, Brandenburg, Deutschland". */
  place_name?: string
  /** Machine place type(s), e.g. ["municipality"] — used to pick the result icon. */
  place_type?: PlaceType[]
  /** Localized human place type(s), e.g. ["Gemeinde"] — shown next to the name. */
  place_type_name?: string[]
  center?: [number, number]
  bbox?: [number, number, number, number]
  // Real boundary/line/point geometry from the geocoding response — drawn on the map on pick.
  geometry?: Geometry
}

/**
 * Look up a single feature by id to get its full geometry. The search response only
 * carries Point geometry; `/geocoding/{id}.json` returns the real boundary (Polygon),
 * line (canal/road), or point — mirrors the geocoder's `fetchFullGeometryOnPick`.
 */
const fetchFeatureById = async (
  id: string,
  signal: AbortSignal,
): Promise<GeoFeature | undefined> => {
  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(id)}.json`)
  url.searchParams.set('key', MAPTILER_API_KEY)
  url.searchParams.set('language', 'de')
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Geocoding feature request failed: ${response.status}`)
  const json = (await response.json()) as { features?: GeoFeature[] }
  return json.features?.[0]
}

/**
 * Shared place search for the desktop and mobile search UIs. Geocoding runs through
 * TanStack Query — the query's `signal` cancels stale in-flight requests (race-safe)
 * and results are cached — so no hand-rolled fetch effect is needed. Selecting a
 * result flies the map there. Replaces the @maptiler/geocoding-control dependency
 * with a direct call to MapTiler's geocoding API (same key/country/proximity).
 */
export const useGeocodingSearch = () => {
  const { mainMap } = useMap()
  const queryClient = useQueryClient()
  const activeFeature = useSearchResultStore((state) => state.feature)
  const setResultFeature = useSearchResultStore((state) => state.setFeature)
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const debouncedQuery = useDebouncedValue(trimmed, 300)

  const { data } = useQuery({
    queryKey: ['geocoding', debouncedQuery],
    queryFn: async ({ signal }) => {
      const url = new URL(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(debouncedQuery)}.json`,
      )
      url.searchParams.set('key', MAPTILER_API_KEY)
      url.searchParams.set('country', 'de')
      url.searchParams.set('language', 'de')
      url.searchParams.set('limit', '5')
      const center = mainMap?.getCenter()
      if (center) url.searchParams.set('proximity', `${center.lng},${center.lat}`)
      const response = await fetch(url, { signal })
      if (!response.ok) throw new Error(`Geocoding request failed: ${response.status}`)
      const json = (await response.json()) as { features?: GeoFeature[] }
      return json.features ?? []
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

  // Replace the on-screen result with the full geometry fetched by id (cached + deduped via
  // TanStack Query). Guarded so a slow response can't overwrite a result picked afterwards.
  const upgradeToFullGeometry = async (feature: GeoFeature) => {
    try {
      const full = await queryClient.fetchQuery({
        queryKey: ['geocoding-feature', feature.id],
        queryFn: ({ signal }) => fetchFeatureById(feature.id, signal),
        staleTime: 30 * 60 * 1000,
      })
      if (full?.geometry && useSearchResultStore.getState().feature?.id === feature.id) {
        setResultFeature({ ...feature, geometry: full.geometry, bbox: full.bbox ?? feature.bbox })
        // Re-frame to the actual geometry — the search response only knew a point, so a street
        // line or boundary needs its own bounds to come fully into view.
        const [minX, minY, maxX, maxY] = bbox(full.geometry)
        mainMap?.fitBounds([minX, minY, maxX, maxY], { padding: 60, maxZoom: 16 })
      }
    } catch {
      // Keep the point geometry already shown.
    }
  }

  // Draw the result's geometry on the map and move the camera to it.
  const selectFeature = (feature: GeoFeature) => {
    setResultFeature(feature)
    if (feature.bbox) {
      mainMap?.fitBounds(feature.bbox, { padding: 60, maxZoom: 16 })
    } else if (feature.center) {
      mainMap?.flyTo({ center: feature.center, zoom: 14 })
    }
    // The search response only has Point geometry; fetch the real boundary/line on pick.
    void upgradeToFullGeometry(feature)
  }

  // Remove the active result from the map (no geometry → map reset to nothing).
  const clearResult = () => setResultFeature(null)

  // Gate on the immediate (not debounced) query so clearing the input hides results at once.
  const results = trimmed.length >= 2 ? (data ?? []) : []

  return { query, setQuery, results, selectFeature, clearResult, activeFeature }
}
