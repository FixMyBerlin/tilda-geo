import { sources } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/sources.const'
import { subcat_bikelanes } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/subcat_bikelanes.const'
import { Layer, Source } from 'react-map-gl/maplibre'

export const SourceLayerBikelanes = () => {
  const bikelanesSource = sources.find((source) => source.id.includes('bikelanes'))
  const bikelanesDefaultStyle = subcat_bikelanes.styles.find((style) => style.id === 'default')

  if (!bikelanesSource || !bikelanesDefaultStyle) {
    console.log('ERROR in SourceLayerBikelanes, missing data:', {
      bikelanesSource,
      bikelanesDefaultStyle,
    })
    return null
  }

  return (
    <>
      <Source
        id={bikelanesSource.id}
        type="vector"
        tiles={[bikelanesSource.tiles]}
        maxzoom={bikelanesSource.maxzoom}
        minzoom={bikelanesSource.minzoom}
      />
      {bikelanesDefaultStyle?.layers?.map((layer) => {
        return (
          <Layer
            key={`notes_new_map_bikelanes_${layer.id}`}
            id={`notes_new_map_bikelanes_${layer.id}`}
            source={bikelanesSource.id}
            source-layer={layer['source-layer']}
            type={layer.type as any}
            layout={layer.layout || {}}
            paint={layer.paint as any}
            filter={layer.filter as any}
          />
        )
      })}
    </>
  )
}
