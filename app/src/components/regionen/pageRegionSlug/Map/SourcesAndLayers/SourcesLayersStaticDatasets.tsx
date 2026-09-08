import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { layerVisibility } from '../utils/layerVisibility'
import { LayerHighlight } from './LayerHighlight'
import { buildUploadLayerProps, isUploadStyleLayer } from './utils/buildUploadLayerProps'
import { createUploadSourceProps, resolveUploadBeforeId } from './utils/uploadSourceLayerUtils'

// Renders user-selectable static datasets controlled by URL parameters.
// SystemLayer datasets are handled separately by SourcesSystemDatasets / LayersSystemDatasets.

export const SourcesStaticDatasets = () => {
  const { dataParam: selectedDatasetIds } = useDataParam()
  const { data: regionDatasets } = useRegionDatasetsQuery()
  if (!regionDatasets.length) return null

  const selectedDatasetIdsSet = new Set(selectedDatasetIds ?? [])

  return (
    <>
      {regionDatasets.map(
        ({ id: sourceId, subId, mapRenderFormat, mapRenderUrl, attributionHtml }) => {
          const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId)
          const sourceProps = createUploadSourceProps({
            mapRenderFormat,
            mapRenderUrl,
            loadData: selectedDatasetIdsSet.has(datasetSourceId),
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

export const LayersStaticDatasets = () => {
  const { dataParam: selectedDatasetIds } = useDataParam()
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { data: regionDatasets } = useRegionDatasetsQuery()

  if (!regionDatasets.length) return null

  const selectedDatasetIdsSet = new Set(selectedDatasetIds ?? [])

  const layerEntries = regionDatasets.flatMap(
    ({ id: sourceId, subId, mapRenderFormat, layers }) => {
      const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId)
      const visible = selectedDatasetIdsSet.has(datasetSourceId)

      return layers.filter(isUploadStyleLayer).map((layer) => {
        const layerId = createDatasetSourceLayerKey(sourceId, subId, layer.id)
        const layerHighlightId = getLayerHighlightId(layerId)
        const beforeId = resolveUploadBeforeId(layer)
        const layerProps = buildUploadLayerProps({
          layer,
          layerId,
          sourceId: datasetSourceId,
          debugLayerStyles,
          beforeId,
          visibility: layerVisibility(visible),
          ...(mapRenderFormat === 'pmtiles' && { sourceLayer: 'default' as const }),
        })
        return { layerId, layerHighlightId, layerProps }
      })
    },
  )

  return (
    <>
      {/* Highlights after all base layers so a highlighted feature is never covered by a sibling base layer of the same beforeId group (matches the pre-DB-order behaviour). */}
      {layerEntries.map(({ layerId, layerProps }) => (
        <Layer key={layerId} {...layerProps} />
      ))}
      {layerEntries.map(({ layerHighlightId, layerProps }) => (
        <LayerHighlight key={layerHighlightId} {...layerProps} id={layerHighlightId} />
      ))}
    </>
  )
}
