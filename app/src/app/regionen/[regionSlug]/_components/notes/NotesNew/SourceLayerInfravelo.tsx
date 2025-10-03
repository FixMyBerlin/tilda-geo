import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionDatasets } from '../../../_hooks/useRegionDatasets/useRegionDatasets'
import { createPmtilesUrl } from '../../Map/SourcesAndLayers/utils/createPmtilesUrl'
import { createDatasetSourceLayerKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

export const SourceLayerInfravelo = () => {
  const regionDatasets = useRegionDatasets()
  const datasetKeys = [
    'infravelo-datensatz-knoten-fortlaufend',
    'infravelo-datensatz-c-fortlaufend',
  ]
  const datasets = regionDatasets.filter((dataset) => datasetKeys.includes(dataset.id))

  if (!datasets.length) {
    console.log('ERROR in SourceLayerRegionBgSg, missing data:', {
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
              return (
                <Layer
                  key={`notes_new_map_${layerId}`}
                  id={`notes_new_map_${layerId}`}
                  source={dataset.id}
                  source-layer={'default'}
                  type={layer.type as any}
                  layout={layer.layout || {}}
                  paint={layer.paint as any}
                  filter={layer.filter || (['all'] as any)}
                />
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}
