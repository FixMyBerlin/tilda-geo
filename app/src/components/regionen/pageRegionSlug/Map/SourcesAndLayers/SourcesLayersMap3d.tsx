import { Layer, Source } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'

export const MAPTERHORN_DEM_SOURCE_ID = 'mapterhorn-dem'
const MAP3D_BUILDINGS_LAYER_ID = 'tilda-3d-buildings'

const BUILDINGS_BEFORE_ID = 'atlas-app-beforeid-below-roadname'

export const SourcesLayersMap3d = () => {
  const { is3dBuildingActive, is3dTerrainActive } = useBg3dParam()

  if (!is3dBuildingActive && !is3dTerrainActive) return null

  return (
    <>
      {is3dTerrainActive && (
        <Source
          id={MAPTERHORN_DEM_SOURCE_ID}
          type="raster-dem"
          url="https://tiles.mapterhorn.com/tilejson.json"
          tileSize={512}
          encoding="terrarium"
          attribution='Terrain data by <a href="https://mapterhorn.com/" target="_blank" rel="noopener noreferrer">Mapterhorn</a>'
        />
      )}
      {is3dBuildingActive && (
        <Layer
          id={MAP3D_BUILDINGS_LAYER_ID}
          type="fill-extrusion"
          source="openmaptiles"
          source-layer="building"
          minzoom={15}
          beforeId={BUILDINGS_BEFORE_ID}
          paint={{
            'fill-extrusion-color': '#d4d4d8',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.75,
          }}
        />
      )}
    </>
  )
}
