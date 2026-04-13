import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'

export type GeneralizedTableId = `atlas_generalized_${Lowercase<TableId>}`
export function generalizationFunctionIdentifier<T extends UnionTiles<TableId>>(tileId: T) {
  return tileId
    .split(',')
    .map((id) => `atlas_generalized_${id.toLowerCase()}`)
    .join(',') as UnionTiles<GeneralizedTableId>
}
