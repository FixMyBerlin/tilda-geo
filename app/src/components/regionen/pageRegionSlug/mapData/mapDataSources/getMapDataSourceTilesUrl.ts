import { getAtlasVectorTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/getAtlasVectorTilesUrl'
import {
  hasExplicitTilesUrl,
  type MapDataSource,
} from '@/components/regionen/pageRegionSlug/mapData/types'

/** Resolve tile URL for any `MapDataSource` (processing or explicit tilesUrl). */
export const getMapDataSourceTilesUrl = (source: MapDataSource<string>) => {
  if (hasExplicitTilesUrl(source)) return source.tilesUrl
  return getAtlasVectorTilesUrl(source.tileTables)
}
