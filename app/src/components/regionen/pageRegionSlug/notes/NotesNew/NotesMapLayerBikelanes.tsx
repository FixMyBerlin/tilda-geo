import { Layer, Source } from 'react-map-gl/maplibre'
import { sources } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { subcat_bikelanes } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_bikelanes.const'
import {
  buildAtlasLayerProps,
  isAtlasStyleLayer,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/buildAtlasLayerProps'

export const NotesMapLayerBikelanes = () => {
  const bikelanesSource = sources.find((source) => source.id.includes('bikelanes'))
  const bikelanesDefaultStyle = subcat_bikelanes.styles.find((style) => style.id === 'default')

  if (!bikelanesSource || !bikelanesDefaultStyle) {
    console.log('ERROR in NotesMapLayerBikelanes, missing data:', {
      bikelanesSource,
      bikelanesDefaultStyle,
    })
    return null
  }

  const layers = bikelanesDefaultStyle?.layers?.filter(isAtlasStyleLayer)

  return (
    <>
      <Source
        id={bikelanesSource.id}
        type="vector"
        tiles={[bikelanesSource.tiles]}
        maxzoom={bikelanesSource.maxzoom}
        minzoom={bikelanesSource.minzoom}
      />
      {layers?.map((layer) => {
        const layerProps = buildAtlasLayerProps({
          layer,
          layerId: `notes_new_map_bikelanes_${layer.id}`,
          sourceKey: bikelanesSource.id,
          visibility: { visibility: 'visible' },
          debugLayerStyles: false,
          backgroundId: undefined,
          subcategoryBeforeId: undefined,
        })
        return <Layer key={layerProps.id} {...layerProps} />
      })}
    </>
  )
}
