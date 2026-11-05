import { describe, expect, test } from 'vitest'
import { generalizationFunctionIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/generalizationIdentifier'
import { getTildaVectorTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/getTildaVectorTilesUrl'
import type { UnionTiles } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import type { TableId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'

const tilePathSuffix = (tileTables: readonly TableId[]) => {
  const tilePath = generalizationFunctionIdentifier(tileTables.join(',') as UnionTiles<TableId>)
  return `/${tilePath}/{z}/{x}/{y}`
}

describe('getTildaVectorTilesUrl', () => {
  test('single table', () => {
    expect(getTildaVectorTilesUrl(['bikelanes'])).toContain(tilePathSuffix(['bikelanes']))
  })

  test('multi-table source', () => {
    expect(getTildaVectorTilesUrl(['boundaries', 'boundaryLabels'])).toContain(
      tilePathSuffix(['boundaries', 'boundaryLabels']),
    )
  })

  test('camelCase table id is lowercased in tile path', () => {
    expect(getTildaVectorTilesUrl(['roadsPathClasses'])).toContain(
      '/atlas_generalized_roadspathclasses/{z}/{x}/{y}',
    )
  })
})
