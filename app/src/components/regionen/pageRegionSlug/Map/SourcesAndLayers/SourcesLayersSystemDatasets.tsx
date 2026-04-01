import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useRegionSystemLayerDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { isMaskLayer } from '../utils/maskLayerUtils'
import { buildUploadLayerProps, type UploadLayerWithAtlasType } from './utils/buildUploadLayerProps'
import { createPmtilesUrl } from './utils/createPmtilesUrl'

// Renders systemLayer datasets that are always active and hidden from UI.
// These datasets are not controlled by URL parameters and are always visible.
// Mask layers are systemLayer but the layer ID gets special treatment.
export const SourcesLayersSystemDatasets = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { data: systemLayerDatasets } = useRegionSystemLayerDatasetsQuery()
  if (!systemLayerDatasets.length) return null

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
                // Mask layers use hardcoded IDs (without prefix) so they can be added to interactive layers.
                const isMask = isMaskLayer(layer.id)
                const layerId = isMask
                  ? layer.id
                  : createDatasetSourceLayerKey(sourceId, subId ?? undefined, layer.id)
                const beforeId = isMask
                  ? undefined
                  : 'beforeId' in layer
                    ? layer.beforeId || 'atlas-app-beforeid-fallback'
                    : 'atlas-app-beforeid-fallback'
                const layerProps = buildUploadLayerProps({
                  layer: layer as UploadLayerWithAtlasType,
                  layerId,
                  sourceId: datasetSourceId,
                  debugLayerStyles,
                  beforeId,
                  ...(mapRenderFormat === 'pmtiles' && { sourceLayer: 'default' as const }),
                })
                return <Layer key={layerId} {...layerProps} />
              })}
            </Fragment>
          )
        },
      )}
    </>
  )
}
