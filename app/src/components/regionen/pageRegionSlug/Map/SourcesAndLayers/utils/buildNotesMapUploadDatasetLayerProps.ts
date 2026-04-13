import type { LayerProps } from 'react-map-gl/maplibre'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'

/**
 * Build LayerProps for upload/static dataset layers on the notes map only.
 * Fixed `source-layer: 'default'` reflects that this is only for upload (pmtiles) layers.
 * Config layer type is a union so we assert once here instead of at every call site.
 */
export function buildNotesMapUploadDatasetLayerProps(
  layer: RegionDataset['layers'][number],
  layerId: string,
  sourceId: string,
) {
  return {
    id: layerId,
    source: sourceId,
    'source-layer': 'default',
    type: layer.type,
    layout: layer.layout || {},
    paint: layer.paint,
    filter: layer.filter ?? (['all'] as const),
  } as LayerProps
}
