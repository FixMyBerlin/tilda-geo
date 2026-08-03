import { Layer, Source } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import {
  MAPTERHORN_DEM_ATTRIBUTION,
  MAPTERHORN_DEM_SOURCE_ID,
  MAPTERHORN_TILE_SIZE,
  MAPTERHORN_TILEJSON_URL,
} from './mapterhornDem'

const MAP3D_HILLSHADE_LAYER_ID = 'tilda-3d-hillshade'

/**
 * Mapterhorn DEM for MapLibre terrain + hillshade relief.
 * Mounts in the same render as `RegionMap`'s `terrain={…}` so the source
 * exists when terrain is applied. Hillshade is not part of the base style —
 * MapTiler `style.json` has none, and DEM only exists while 3D is on.
 */
export const SourcesLayersMap3dDem = () => {
  const { is3dActive } = useBg3dParam()
  if (!is3dActive) return null

  return (
    <>
      <Source
        id={MAPTERHORN_DEM_SOURCE_ID}
        type="raster-dem"
        url={MAPTERHORN_TILEJSON_URL}
        tileSize={MAPTERHORN_TILE_SIZE}
        encoding="terrarium"
        attribution={MAPTERHORN_DEM_ATTRIBUTION}
      />
      {/* Same band as raster backgrounds / 3D buildings: under road names. */}
      <Layer
        id={MAP3D_HILLSHADE_LAYER_ID}
        type="hillshade"
        source={MAPTERHORN_DEM_SOURCE_ID}
        beforeId="atlas-app-beforeid-below-roadname"
        paint={{
          'hillshade-exaggeration': 0.65,
          'hillshade-shadow-color': '#473B24',
          'hillshade-highlight-color': '#FFFFFF',
          'hillshade-accent-color': '#000000',
          'hillshade-illumination-direction': 335,
        }}
      />
    </>
  )
}
