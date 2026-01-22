import { useMapDebugUseDebugLayerStyles } from '@/src/app/regionen/[regionSlug]/_hooks/mapState/useMapDebugState'
import { FilterSpecification } from 'maplibre-gl'
import { Fragment } from 'react'
import { Layer, LayerProps, Source } from 'react-map-gl/maplibre'
import { useRegionDatasetsSystemLayer } from '../../../_hooks/useRegionDatasets/useRegionDatasets'
import { debugLayerStyles } from '../../../_mapData/mapDataSubcategories/mapboxStyles/debugLayerStyles'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { isMaskLayer } from '../utils/maskLayerUtils'
import { createPmtilesUrl } from './utils/createPmtilesUrl'
import { wrapFilterWithAll } from './utils/filterUtils/wrapFilterWithAll'

// Renders systemLayer datasets that are always active and hidden from UI.
// These datasets are not controlled by URL parameters and are always visible.
// Mask layers are systemLayer but the layer ID gets special treatment.
export const SourcesLayersSystemDatasets = () => {
  const useDebugLayerStyles = useMapDebugUseDebugLayerStyles()
  const systemLayerDatasets = useRegionDatasetsSystemLayer()

  if (!systemLayerDatasets || systemLayerDatasets.length === 0) return null

  return (
    <>
      {systemLayerDatasets.map(
        ({ id: sourceId, subId, mapRenderFormat, mapRenderUrl, attributionHtml, layers }) => {
          const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId ?? undefined)

          const sourceProps =
            mapRenderFormat === 'geojson'
              ? { type: 'geojson' as const, data: mapRenderUrl }
              : { type: 'vector' as const, url: createPmtilesUrl(mapRenderUrl) }

          return (
            <Fragment key={datasetSourceId}>
              <Source
                id={datasetSourceId}
                key={datasetSourceId}
                attribution={attributionHtml}
                {...sourceProps}
              />
              {layers.map((layer) => {
                const layout = layer.layout || {}

                // Mask layers use hardcoded IDs (without prefix) so they can be added to interactive layers.
                // This follows the pattern from SourcesLayersRegionMask which used hardcoded IDs: mask-buffer, mask-boundary, mask-boundary-bg
                // See maskLayerUtils.ts for mask layer utilities and MASK_INTERACTIVE_LAYER_IDS.
                const isMask = isMaskLayer(layer.id)
                const layerId = isMask
                  ? layer.id
                  : createDatasetSourceLayerKey(sourceId, subId ?? undefined, layer.id)

                const layerFilter = (
                  useDebugLayerStyles ? ['all'] : wrapFilterWithAll(layer.filter)
                ) as FilterSpecification

                const layerPaint = useDebugLayerStyles
                  ? debugLayerStyles({
                      source: sourceId,
                      sourceLayer: 'default',
                    }).find((l) => l.type === layer.type)?.paint
                  : layer.paint

                const layerProps: LayerProps = {
                  id: layerId,
                  source: datasetSourceId,
                  type: layer.type,
                  layout,
                  filter: layerFilter as any,
                  paint: layerPaint as any,
                  // Mask layers don't use beforeId (like the old SourcesLayersRegionMask component)
                  // Other system layers use beforeId from config or fallback
                  ...(isMask
                    ? {}
                    : {
                        beforeId:
                          'beforeId' in layer
                            ? (layer.beforeId as string) || 'atlas-app-beforeid-fallback'
                            : 'atlas-app-beforeid-fallback',
                      }),
                }

                if (mapRenderFormat === 'pmtiles') {
                  layerProps['source-layer'] = 'default'
                }

                return <Layer key={layerId} {...layerProps} />
              })}
            </Fragment>
          )
        },
      )}
    </>
  )
}
