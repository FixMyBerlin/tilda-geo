import type { FilterSpecification } from 'maplibre-gl'
import type { LayerProps } from 'react-map-gl/maplibre'
import { getDebugStyleForLayerType } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/debugLayerStyles'
import type {
  AtlasLayerType,
  FileMapDataSubcategoryStyleLayer,
  TBeforeIds,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { beforeId } from './beforeId'

export type AtlasStyleLayer = Extract<FileMapDataSubcategoryStyleLayer, { type: AtlasLayerType }>

export const ATLAS_LAYER_TYPES = [
  'fill',
  'line',
  'circle',
  'symbol',
  'heatmap',
] as const satisfies AtlasLayerType[]

/** Convention: config is expected to use only these layer types; use when filtering before buildAtlasLayerProps. */
export function isAtlasStyleLayer(
  layer: FileMapDataSubcategoryStyleLayer,
): layer is AtlasStyleLayer {
  return ATLAS_LAYER_TYPES.includes(layer.type)
}

type Visibility = { visibility: 'visible' | 'none' }

type BuildAtlasLayerPropsParams = {
  layer: AtlasStyleLayer
  layerId: string
  sourceKey: string
  visibility: Visibility
  debugLayerStyles: boolean
  backgroundId: string | undefined
  subcategoryBeforeId: TBeforeIds
}

/** Build LayerProps by switching on layer.type so each branch returns a single coherent layer type (no assertion). */
export function buildAtlasLayerProps({
  layer,
  layerId,
  sourceKey,
  visibility,
  debugLayerStyles,
  backgroundId,
  subcategoryBeforeId,
}: BuildAtlasLayerPropsParams) {
  const layerFilter: FilterSpecification | undefined = debugLayerStyles
    ? (['all'] as const)
    : layer.filter
  const base = {
    id: layerId,
    source: sourceKey,
    'source-layer': layer['source-layer'],
    beforeId: beforeId({
      backgroundId,
      subcategoryBeforeId,
      layerType: layer.type,
    }),
    ...(layerFilter ? { filter: layerFilter } : {}),
    ...(layer.maxzoom ? { maxzoom: layer.maxzoom } : {}),
    ...(layer.minzoom ? { minzoom: layer.minzoom } : {}),
  }
  const debugStyle = debugLayerStyles ? getDebugStyleForLayerType(layer.type) : undefined
  const layout = debugStyle
    ? { ...debugStyle.layout, ...visibility }
    : { ...visibility, ...(layer.layout ?? {}) }
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
