import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { buildNotesMapUploadDatasetLayerProps } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/buildNotesMapUploadDatasetLayerProps'
import { createPmtilesUrl } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/createPmtilesUrl'
import { createDatasetSourceLayerKey } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

export const NotesMapLayerRegionBbSg = () => {
  const { data: regionDatasets } = useRegionDatasetsQuery()
  const datasetKey = 'bb-ramboll-netzentwurf-2'
  const dataset = regionDatasets.find((d) => d.id === datasetKey)

  if (!dataset) {
    console.log('ERROR in NotesMapLayerRegionBbSg, missing data:', { regionDatasets, datasetKey })
    return null
  }

  return (
    <>
      <Source id={dataset.id} type="vector" url={createPmtilesUrl(dataset.mapRenderUrl)} />
      {dataset.layers?.map((layer) => {
        const layerId = createDatasetSourceLayerKey(dataset.id, dataset.subId, layer.id)
        const displayLayerId = `notes_new_map_${layerId}`
        return (
          <Layer
            key={displayLayerId}
            {...buildNotesMapUploadDatasetLayerProps(layer, displayLayerId, dataset.id)}
          />
        )
      })}
    </>
  )
}
