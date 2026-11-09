import type { FilterSpecification } from 'maplibre-gl'
import type { LayerProps } from 'react-map-gl/maplibre'
import { getDebugStyleForLayerType } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/layers/debugLayerStyles'
import type {
  RenderableLayerType,
  FileMapDataSubcategoryStyleLayer,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { beforeIdOnBackground, type LayerPosition } from './beforeId'

export type TildaStyleLayer = Extract<
  FileMapDataSubcategoryStyleLayer,
  { type: RenderableLayerType }
>

const RENDERABLE_LAYER_TYPES = [
  'fill',
  'line',
  'circle',
  'symbol',
  'heatmap',
] as const satisfies RenderableLayerType[]

/** Convention: config is expected to use only these layer types; use when filtering before buildTildaLayerProps. */
export function isTildaStyleLayer(
  layer: FileMapDataSubcategoryStyleLayer,
): layer is TildaStyleLayer {
  return RENDERABLE_LAYER_TYPES.includes(layer.type)
}

type Visibility = { visibility: 'visible' | 'none' }

type BuildTildaLayerPropsParams = {
  layer: TildaStyleLayer
  layerId: string
  sourceKey: string
  visibility: Visibility
  debugLayerStyles: boolean
  backgroundId: string | undefined
  /** See `layerPosition`. */
  position: LayerPosition
}

/** Build LayerProps by switching on layer.type so each branch returns a single coherent layer type (no assertion). */
export function buildTildaLayerProps({
  layer,
  layerId,
  sourceKey,
  visibility,
  debugLayerStyles,
  backgroundId,
  position,
}: BuildTildaLayerPropsParams) {
  const layerFilter: FilterSpecification | undefined = debugLayerStyles
    ? (['all'] as const)
    : layer.filter
  const base = {
    id: layerId,
    source: sourceKey,
    'source-layer': layer['source-layer'],
    beforeId: beforeIdOnBackground(position, backgroundId),
    ...(layerFilter ? { filter: layerFilter } : {}),
    ...(layer.maxzoom ? { maxzoom: layer.maxzoom } : {}),
    ...(layer.minzoom ? { minzoom: layer.minzoom } : {}),
  }
  const debugStyle = debugLayerStyles ? getDebugStyleForLayerType(layer.type) : undefined
  const layout = debugStyle
    ? { ...debugStyle.layout, ...visibility }
    : { ...visibility, ...layer.layout }
  const paint = debugStyle ? debugStyle.paint : layer.paint

  switch (layer.type) {
    case 'fill':
      return { ...base, type: 'fill', layout, paint } satisfies Extract<
        LayerProps,
        { type: 'fill' }
      >
    case 'line':
      return { ...base, type: 'line', layout, paint } satisfies Extract<
        LayerProps,
        { type: 'line' }
      >
    case 'circle':
      return { ...base, type: 'circle', layout, paint } satisfies Extract<
        LayerProps,
        { type: 'circle' }
      >
    case 'symbol':
      return { ...base, type: 'symbol', layout, paint } satisfies Extract<
        LayerProps,
        { type: 'symbol' }
      >
    case 'heatmap':
      return { ...base, type: 'heatmap', layout, paint } satisfies Extract<
        LayerProps,
        { type: 'heatmap' }
      >
  }
}
