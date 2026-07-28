import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'

const atlasGeneralizedPrefix = 'atlas_generalized_' as const

type GeneralizedTableId = `${typeof atlasGeneralizedPrefix}${Lowercase<TableId>}`
export function generalizationFunctionIdentifier<T extends UnionTiles<TableId>>(tileId: T) {
  return tileId
    .split(',')
    .map((id) => `${atlasGeneralizedPrefix}${id.toLowerCase()}`)
    .join(',') as UnionTiles<GeneralizedTableId>
}
