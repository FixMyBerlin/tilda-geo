import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'

const generalizedTablePrefix = 'atlas_generalized_' as const

type GeneralizedTableId = `${typeof generalizedTablePrefix}${Lowercase<TableId>}`
export function generalizationFunctionIdentifier<T extends UnionTiles<TableId>>(tileId: T) {
  return tileId
    .split(',')
    .map((id) => `${generalizedTablePrefix}${id.toLowerCase()}`)
    .join(',') as UnionTiles<GeneralizedTableId>
}
