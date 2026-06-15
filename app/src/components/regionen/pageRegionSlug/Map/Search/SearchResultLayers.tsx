import { feature } from '@turf/helpers'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useSearchResultStore } from './useSearchResultStore'

const SEARCH_RESULT_SOURCE = 'search-result'

/**
 * Draws the picked geocoding result's geometry on the map (boundary polygon, line,
 * or point) — restores the native @maptiler/geocoding-control behavior using
 * react-map-gl Source/Layer. Rendered inside `<Map>` (RegionMap); fed by the
 * search UI via useSearchResultStore. Decorative, so kept out of interactiveLayerIds.
 *
 * A faint violet fill for polygons, a dotted violet line for streets / polygon
 * outlines, and a violet dot for point results. Violet (Tailwind violet-600)
 * keeps it distinct from the map's own blue data. Decorative — no white casing.
 */
const VIOLET = '#7c3aed' // tailwind violet-600

export const SearchResultLayers = () => {
  const result = useSearchResultStore((state) => state.feature)

  if (!result?.geometry) return null

  const data = feature(result.geometry)

  return (
    <>
      <Source id={SEARCH_RESULT_SOURCE} type="geojson" data={data} />
      {/* Fill only for polygons, so a line/point result never gets a polygon background. */}
      <Layer
        id="search-result-fill"
        source={SEARCH_RESULT_SOURCE}
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{ 'fill-color': VIOLET, 'fill-opacity': 0.1 }}
      />
      {/* Dotted line for LineString results (streets) and polygon outlines. */}
      <Layer
        id="search-result-line"
        source={SEARCH_RESULT_SOURCE}
        type="line"
        filter={['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]]}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': VIOLET, 'line-width': 4, 'line-dasharray': [0, 2] }}
      />
      {/* Marker only for point results. */}
      <Layer
        id="search-result-circle"
        source={SEARCH_RESULT_SOURCE}
        type="circle"
        filter={['==', ['geometry-type'], 'Point']}
        paint={{
          'circle-radius': 7,
          'circle-color': VIOLET,
          'circle-opacity': 0.9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }}
      />
    </>
  )
}
