import { describe, expect, test } from 'vitest'
import { generalizationFunctionIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/generalizationIdentifier'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import { sources } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import type { UnionTiles } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import type { TableId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { hasExplicitTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/types'

const expectedTilePathSuffix = (tileTables: readonly TableId[]) => {
  const tilePath = generalizationFunctionIdentifier(tileTables.join(',') as UnionTiles<TableId>)
  return `/${tilePath}/{z}/{x}/{y}`
}

describe('atlas map data sources', () => {
  test('processing sources store tileTables without tilesUrl', () => {
    for (const source of sources) {
      if (hasExplicitTilesUrl(source)) continue

      expect(source).not.toHaveProperty('tilesUrl')
      expect(getMapDataSourceTilesUrl(source)).toContain(expectedTilePathSuffix(source.tileTables))
    }
  })

  test('explicit tilesUrl sources use tileTables null', () => {
    const explicitTilesUrlSources = sources.filter(hasExplicitTilesUrl)

    expect(explicitTilesUrlSources.map((source) => source.id).sort()).toEqual(
      [
        'lars_parking',
        'lars_parking_areas',
        'lars_parking_debug',
        'lars_parking_points',
        'lars_parking_stats',
        'atlas_presenceStats',
        'accidents_unfallatlas',
        'atlas_aggregated_lengths',
        'mapillary_coverage',
      ].sort(),
    )

    for (const source of explicitTilesUrlSources) {
      expect(source.tilesUrl).toEqual(expect.any(String))
      expect(getMapDataSourceTilesUrl(source)).toBe(source.tilesUrl)
    }
  })
})
