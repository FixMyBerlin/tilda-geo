import { describe, expect, test } from 'vitest'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import { sources } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { hasExplicitTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/types'

describe('getMapDataSourceTilesUrl', () => {
  test('narrows processing vs explicit tilesUrl sources', () => {
    const processing = sources.find((source) => source.id === 'atlas_bikelanes')
    const explicitTilesUrl = sources.find((source) => source.id === 'mapillary_coverage')

    if (!processing || !explicitTilesUrl) throw new Error('fixture sources missing')
    if (!hasExplicitTilesUrl(explicitTilesUrl)) throw new Error('expected explicit tilesUrl source')

    expect(hasExplicitTilesUrl(processing)).toBe(false)
    expect(processing).not.toHaveProperty('tilesUrl')
    expect(getMapDataSourceTilesUrl(processing)).toContain('atlas_generalized_bikelanes')

    expect(explicitTilesUrl.tilesUrl).toEqual(expect.any(String))
    expect(getMapDataSourceTilesUrl(explicitTilesUrl)).toBe(explicitTilesUrl.tilesUrl)
  })
})
