import type { FilterSpecification } from 'maplibre-gl'
import type { LayerProps } from 'react-map-gl/maplibre'
import { getDebugStyleForLayerType } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/debugLayerStyles'
import type { AtlasLayerType } from '@/components/regionen/pageRegionSlug/mapData/types'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { wrapFilterWithAll } from './filterUtils/wrapFilterWithAll'

type UploadLayer = RegionDataset['layers'][number]
export type UploadLayerWithAtlasType = Extract<UploadLayer, { type: AtlasLayerType }>

type BuildUploadLayerPropsParams = {
  layer: UploadLayerWithAtlasType
  layerId: string
  sourceId: string
  debugLayerStyles: boolean
  beforeId?: string
  sourceLayer?: 'default'
}

/** Build LayerProps from upload config layer. Same switch-on-type rhythm as buildAtlasLayerProps; shared by Static and System dataset layers. */
export function buildUploadLayerProps({
  layer,
  layerId,
  sourceId,
  debugLayerStyles,
  beforeId,
  sourceLayer,
}: BuildUploadLayerPropsParams) {
  const filter: FilterSpecification = debugLayerStyles
    ? (['all'] as const)
    : wrapFilterWithAll(layer.filter)
  const base = {
    id: layerId,
    source: sourceId,
    filter,
    ...(beforeId !== undefined && { beforeId }),
    ...(sourceLayer !== undefined && { 'source-layer': sourceLayer }),
  }
  const debugStyle = debugLayerStyles ? getDebugStyleForLayerType(layer.type) : undefined
  const layout = debugStyle ? { ...debugStyle.layout } : { ...(layer.layout ?? {}) }
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
