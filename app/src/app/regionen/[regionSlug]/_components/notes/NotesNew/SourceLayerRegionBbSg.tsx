import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionDatasets } from '../../../_hooks/useRegionDatasets/useRegionDatasets'
import { createPmtilesUrl } from '../../Map/SourcesAndLayers/utils/createPmtilesUrl'
import { createDatasetSourceLayerKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

export const SourceLayerRegionBbSg = () => {
  const regionDatasets = useRegionDatasets()
  const datasetKey = 'bb-ramboll-netzentwurf-2'
  const dataset = regionDatasets.find((dataset) => dataset.id === datasetKey)

  if (!dataset) {
    console.log('ERROR in SourceLayerRegionBgSg, missing data:', { regionDatasets, datasetKey })
    return null
  }

  return (
    <>
      <Source id={dataset.id} type="vector" url={createPmtilesUrl(dataset.url)} />
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
    </>
  )
}
