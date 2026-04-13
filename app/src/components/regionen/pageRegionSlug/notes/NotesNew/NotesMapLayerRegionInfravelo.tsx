import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { buildNotesMapUploadDatasetLayerProps } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/buildNotesMapUploadDatasetLayerProps'
import { createPmtilesUrl } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/createPmtilesUrl'
import { createDatasetSourceLayerKey } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

export const NotesMapLayerRegionInfravelo = () => {
  const { data: regionDatasets } = useRegionDatasetsQuery()
  const datasetKeys = [
    'infravelo-datensatz-knoten-fortlaufend',
    'infravelo-datensatz-c-fortlaufend',
  ]
  const datasets = regionDatasets.filter((dataset) => datasetKeys.includes(dataset.id))

  if (!datasets.length) {
    console.log('ERROR in NotesMapLayerRegionInfravelo, missing data:', {
      regionDatasets,
      datasetKey: datasetKeys,
    })
    return null
  }

  return (
    <>
      {datasets.map((dataset) => {
        return (
          <Fragment key={dataset.id}>
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
          </Fragment>
        )
      })}
    </>
  )
}
