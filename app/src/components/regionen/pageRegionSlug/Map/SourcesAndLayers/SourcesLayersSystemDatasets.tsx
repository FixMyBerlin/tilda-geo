import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useRegionSystemLayerDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { isMaskLayer } from '../utils/maskLayerUtils'
import { buildUploadLayerProps, isUploadStyleLayer } from './utils/buildUploadLayerProps'
import { createUploadSourceProps, resolveUploadBeforeId } from './utils/uploadSourceLayerUtils'

// Renders systemLayer datasets that are always active and hidden from UI.
// These datasets are not controlled by URL parameters and are always visible.
// Mask layers are systemLayer but the layer ID gets special treatment.
//
// Sources and Layers are rendered by two separate components (via <AllSources> / <AllLayers>)
// so all Layers of the map form one flat, sortable list independent of their Source.
// See LAYER_SORTING_REQUIREMENTS.md.

export const SourcesSystemDatasets = () => {
  const { data: systemLayerDatasets } = useRegionSystemLayerDatasetsQuery()
  if (!systemLayerDatasets.length) return null

  return (
    <>
      {systemLayerDatasets.map(
        ({ id: sourceId, subId, mapRenderFormat, mapRenderUrl, attributionHtml }) => {
          const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId ?? undefined)

          // System layers are always visible, so geojson data loads immediately.
          const sourceProps = createUploadSourceProps({
            mapRenderFormat,
            mapRenderUrl,
            loadData: true,
          })

          return (
            <Source
              id={datasetSourceId}
              key={datasetSourceId}
              attribution={attributionHtml}
              {...sourceProps}
            />
          )
        },
      )}
    </>
  )
}

export const LayersSystemDatasets = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { data: systemLayerDatasets } = useRegionSystemLayerDatasetsQuery()
  if (!systemLayerDatasets.length) return null

  return (
    <>
      {systemLayerDatasets.map(({ id: sourceId, subId, mapRenderFormat, layers }) => {
        const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId ?? undefined)

        return (
          <Fragment key={datasetSourceId}>
            {layers.filter(isUploadStyleLayer).map((layer) => {
              // Mask layers use hardcoded IDs (without prefix) so they can be added to interactive layers.
              const isMask = isMaskLayer(layer.id)
              const layerId = isMask
                ? layer.id
                : createDatasetSourceLayerKey(sourceId, subId ?? undefined, layer.id)
              const beforeId = isMask ? undefined : resolveUploadBeforeId(layer)
              const layerProps = buildUploadLayerProps({
                layer,
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
      })}
    </>
  )
}
