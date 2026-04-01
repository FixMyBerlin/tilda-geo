import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'
import { buildUploadLayerProps, type UploadLayerWithAtlasType } from './utils/buildUploadLayerProps'
import { createPmtilesUrl } from './utils/createPmtilesUrl'

function createSourceProps(mapRenderFormat: string, mapRenderUrl: string) {
  return mapRenderFormat === 'geojson'
    ? { type: 'geojson' as const, data: mapRenderUrl }
    : { type: 'vector' as const, url: createPmtilesUrl(mapRenderUrl) }
}

// Renders user-selectable static datasets controlled by URL parameters.
// SystemLayer datasets are handled separately by SourcesLayersSystemDatasets.
//
// Performance optimizations:
// - Filters datasets before mapping to avoid unnecessary iterations
// - Uses Set for O(1) visibility lookups instead of O(n) array.includes()
// - React Compiler handles memoization automatically
//
// MapLibre GL JS best practices:
// - Sources are only loaded when visible layers reference them (lazy loading)
// - Unmounting invisible datasets is fine for memory, but causes remount overhead on toggle
// - For frequently toggled datasets, consider keeping mounted with visibility: 'none'
// - Layer identity (id, type) remains stable to avoid style diffing overhead
export const SourcesLayersStaticDatasets = () => {
  const { dataParam: selectedDatasetIds } = useDataParam()
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { data: regionDatasets } = useRegionDatasetsQuery()

  // Use Set for O(1) lookups instead of O(n) array.includes()
  const selectedDatasetIdsSet = selectedDatasetIds ? new Set(selectedDatasetIds) : null

  // Filter visible datasets before mapping to avoid unnecessary iterations
  const visibleDatasets = selectedDatasetIdsSet
    ? regionDatasets.filter(({ id: sourceId, subId }) => {
        const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId)
        return selectedDatasetIdsSet.has(datasetSourceId)
      })
    : []

  if (!selectedDatasetIdsSet || visibleDatasets.length === 0) return null

  return (
    <>
      {visibleDatasets.map(
        ({ id: sourceId, subId, mapRenderFormat, mapRenderUrl, attributionHtml, layers }) => {
          const datasetSourceId = createSourceKeyStaticDatasets(sourceId, subId)
          const sourceProps = createSourceProps(mapRenderFormat, mapRenderUrl)

          return (
            <Fragment key={datasetSourceId}>
              <Source
                id={datasetSourceId}
                key={datasetSourceId}
                attribution={attributionHtml}
                {...sourceProps}
              />
              {layers.map((layer) => {
                const layerId = createDatasetSourceLayerKey(sourceId, subId, layer.id)
                const layerHighlightId = getLayerHighlightId(layerId)
                const beforeId =
                  'beforeId' in layer
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

                return (
                  <Fragment key={layerId}>
                    <Layer key={layerId} {...layerProps} />
                    <LayerHighlight key={layerHighlightId} {...layerProps} id={layerHighlightId} />
                  </Fragment>
                )
              })}
            </Fragment>
          )
        },
      )}
    </>
  )
}
