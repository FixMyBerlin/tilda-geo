import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { generalizationFunctionIdentifier } from './generalizationIdentifier'

/** Tile URL from processing `TableId`(s) → `atlas_generalized_*` PG functions. */
export const getAtlasVectorTilesUrl = (tileTables: readonly TableId[]) => {
  const tilePath = generalizationFunctionIdentifier(tileTables.join(',') as UnionTiles<TableId>)
  return getTilesUrl(`/${tilePath}/{z}/{x}/{y}`)
}
