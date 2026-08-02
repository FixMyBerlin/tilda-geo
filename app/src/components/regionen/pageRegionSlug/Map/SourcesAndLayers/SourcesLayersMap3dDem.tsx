import { Source } from 'react-map-gl/maplibre'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import {
  MAPTERHORN_DEM_ATTRIBUTION,
  MAPTERHORN_DEM_SOURCE_ID,
  MAPTERHORN_TILE_SIZE,
  MAPTERHORN_TILEJSON_URL,
} from './mapterhornDem'

/**
 * Mapterhorn DEM for MapLibre terrain. Mounts in the same render as
 * `RegionMap`'s `terrain={…}` so the source exists when terrain is applied.
 */
export const SourcesLayersMap3dDem = () => {
  const { is3dActive } = useBg3dParam()
  if (!is3dActive) return null

  return (
    <Source
      id={MAPTERHORN_DEM_SOURCE_ID}
      type="raster-dem"
      url={MAPTERHORN_TILEJSON_URL}
      tileSize={MAPTERHORN_TILE_SIZE}
      encoding="terrarium"
      attribution={MAPTERHORN_DEM_ATTRIBUTION}
    />
  )
}
