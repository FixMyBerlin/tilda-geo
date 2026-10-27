import { Layer } from 'react-map-gl/maplibre'
import type { buildAtlasLayerEntries } from '../Map/SourcesAndLayers/sortLayers/buildAtlasLayerEntries'
import type { SourcesId } from '../mapData/mapDataSources/sources.const'
import { routeRelationFilter } from './routeRelations'
import { useHoveredRouteRelation } from './useRouteRelationHighlight'

// Sources whose tables carry `route_relations` (processing/topics/roads_bikelanes/6_route_relations.sql).
const routeRelationSources: SourcesId[] = [
  'atlas_roads',
  'atlas_roadsPathClasses',
  'atlas_bikelanes',
]

const ROUTE_HIGHLIGHT_COLOR = '#c026d3'

type Props = {
  layerEntries: ReturnType<typeof buildAtlasLayerEntries>
}

/**
 * While a route or network class is hovered in the inspector, draws all its lines on the visible
 * way sources, so no extra tiles load. Each highlight takes the `beforeId` of the topmost visible
 * layer of its source (entries come sorted by the layer order) and mounts after it, like
 * `LayerHighlight`.
 */
export const LayersRouteRelationHighlight = ({ layerEntries }: Props) => {
  const hovered = useHoveredRouteRelation()
  if (hovered === null) return null

  const topEntryBySource = new Map(
    layerEntries
      .filter((entry) => entry.visible && routeRelationSources.includes(entry.sourceId))
      .map((entry) => [entry.sourceKey, entry]),
  )
  const filter = routeRelationFilter(hovered)

  return Array.from(topEntryBySource.values(), ({ sourceKey, sourceLayer, layerProps }) => (
    <Layer
      key={sourceKey}
      id={`route-relation-highlight--${sourceKey}`}
      type="line"
      source={sourceKey}
      source-layer={sourceLayer}
      beforeId={layerProps.beforeId}
      filter={filter}
      layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      paint={{ 'line-color': ROUTE_HIGHLIGHT_COLOR, 'line-width': 6, 'line-opacity': 0.85 }}
    />
  ))
}
