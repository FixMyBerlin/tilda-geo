import { Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayersWithHighlights } from './LayersWithHighlights'
import { buildUploadLayerProps, type RenderableUploadLayer } from './utils/buildUploadLayerProps'
import { createPmtilesUrl } from './utils/pmtilesProtocol'

// The static datasets selected in the URL. System datasets: `SourcesLayersSystemDatasets`.
// Sources and layers are two components, see <AllSources> and <AllLayers>.
const useSelectedDatasets = () => {
  const { dataParam } = useDataParam()
  const { data: regionDatasets } = useRegionDatasetsQuery()
  const selected = new Set(dataParam ?? [])
  return regionDatasets.filter(({ id, subId }) =>
    selected.has(createSourceKeyStaticDatasets(id, subId)),
  )
}

export const SourcesStaticDatasets = () => {
  const datasets = useSelectedDatasets()
  return datasets.map(({ id, subId, mapRenderFormat, mapRenderUrl, attributionHtml }) => {
    const sourceKey = createSourceKeyStaticDatasets(id, subId)
    return (
      <Source
        id={sourceKey}
        key={sourceKey}
        attribution={attributionHtml}
        {...(mapRenderFormat === 'geojson'
          ? { type: 'geojson' as const, data: mapRenderUrl }
          : { type: 'vector' as const, url: createPmtilesUrl(mapRenderUrl) })}
      />
    )
  })
}

export const LayersStaticDatasets = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const visibleDatasets = useSelectedDatasets()

  const entries = visibleDatasets.flatMap(({ id, subId, mapRenderFormat, layers }) => {
    const sourceKey = createSourceKeyStaticDatasets(id, subId)
    const sourceLayer = mapRenderFormat === 'pmtiles' ? ('default' as const) : undefined
    return layers.map((layer) => {
      const layerId = createDatasetSourceLayerKey(id, subId, layer.id)
      return {
        layerId,
        highlightLayerId: getLayerHighlightId(layerId),
        sourceKey,
        sourceId: sourceKey,
        sourceLayer,
        reverseDirectionArrows: layer.type === 'line' && layer.reverseDirectionArrows,
        layerProps: buildUploadLayerProps({
          layer: layer as RenderableUploadLayer,
          layerId,
          sourceId: sourceKey,
          debugLayerStyles,
          beforeId: ('beforeId' in layer && layer.beforeId) || 'atlas-app-beforeid-fallback',
          ...(sourceLayer && { sourceLayer }),
        }),
      }
    })
  })

  return <LayersWithHighlights entries={entries} />
}
