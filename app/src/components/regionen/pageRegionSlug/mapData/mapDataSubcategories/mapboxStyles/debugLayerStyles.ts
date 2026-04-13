import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  HeatmapLayerSpecification,
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import { wrapFilterWithAll } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/filterUtils/wrapFilterWithAll'
import type { AtlasLayerType, FileMapDataSubcategoryStyleLayer } from '../../types'

/** Partial layer (source/source-layer/filter added in debugLayerStyles). */
type DebugLayerBase<T> = Omit<T, 'source' | 'source-layer' | 'filter'>

const debugLayerLine = {
  id: 'debugStyleLayerLine',
  type: 'line',
  paint: {
    'line-width': 10,
    'line-color': '#a21caf',
    'line-opacity': 0.6,
  },
  layout: {},
} satisfies DebugLayerBase<LineLayerSpecification>

const debugLayerCircle = {
  id: 'debugStyleLayerCircle',
  type: 'circle',
  paint: {
    'circle-radius': 5,
    'circle-opacity': 0.6,
    'circle-color': '#701a75',
  },
  layout: {},
} satisfies DebugLayerBase<CircleLayerSpecification>

const debugLayerFill = {
  id: 'debugStyleLayerFill',
  type: 'fill',
  paint: {
    'fill-color': '#a21caf',
    'fill-outline-color': '#701a75',
    'fill-opacity': 0.3,
  },
  layout: {},
} satisfies DebugLayerBase<FillLayerSpecification>

const debugLayerSymbol = {
  id: 'debugStyleLayerSymbol',
  type: 'symbol',
  paint: {},
  layout: {
    'icon-image': 'rectangle-red-2',
    'icon-allow-overlap': true,
    'icon-size': 1,
  },
} satisfies DebugLayerBase<SymbolLayerSpecification>

const debugLayerHeatmap = {
  id: 'debugStyleLayerHeatmap',
  type: 'heatmap',
  paint: {
    'heatmap-intensity': 0.8,
    'heatmap-radius': 15,
    'heatmap-opacity': 0.5,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
      0.5,
      '#701a75',
      1,
      '#a21caf',
    ],
  },
  layout: {},
} satisfies DebugLayerBase<HeatmapLayerSpecification>

/** Lookup paint and layout by layer type. Keys are LayerSpecification['type']; types without a debug style are undefined. */
export const DEBUG_STYLE_BY_TYPE: Record<
  LayerSpecification['type'],
  { paint: object; layout: object } | undefined
> = {
  line: { paint: debugLayerLine.paint, layout: debugLayerLine.layout },
  circle: { paint: debugLayerCircle.paint, layout: debugLayerCircle.layout },
  fill: { paint: debugLayerFill.paint, layout: debugLayerFill.layout },
  symbol: { paint: debugLayerSymbol.paint, layout: debugLayerSymbol.layout },
  heatmap: { paint: debugLayerHeatmap.paint, layout: debugLayerHeatmap.layout },
  'fill-extrusion': undefined,
  raster: undefined,
  hillshade: undefined,
  background: undefined,
  'color-relief': undefined,
}

/** Single place to read debug style by type. All AtlasLayerType have a debug style. */
export function getDebugStyleForLayerType(type: AtlasLayerType) {
  const entry = DEBUG_STYLE_BY_TYPE[type]
  if (!entry) throw new Error(`No debug style for layer type: ${type}`)
  return { layout: entry.layout, paint: entry.paint }
}

const debugLayers = [
  debugLayerLine,
  debugLayerCircle,
  debugLayerFill,
  debugLayerSymbol,
  debugLayerHeatmap,
]

export const debugLayerStyles = ({
  source,
  sourceLayer,
  filter,
}: {
  source: string
  sourceLayer: string
  filter?:
    | ['match', ['get', string], (string | number | boolean)[], boolean, boolean]
    | ['has', string]
}) => {
  const layers = debugLayers.map((layer) => ({
    ...layer,
    source,
    'source-layer': sourceLayer,
    filter: wrapFilterWithAll(filter),
  })) as FileMapDataSubcategoryStyleLayer[]
  return layers
}
