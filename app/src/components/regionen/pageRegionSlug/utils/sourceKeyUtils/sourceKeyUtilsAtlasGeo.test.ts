import { describe, expect, test } from 'vitest'
import { createSourceKeyAtlasGeo, parseSourceKeyAtlasGeo } from './sourceKeyUtilsAtlasGeo'

describe('extractSourceIdIdFromAtlasGeoSourceKey()', () => {
  test('work when used with the right input', () => {
    const input = createSourceKeyAtlasGeo('mapillary', 'atlas_barriers', 'bikelanes')
    const { categoryId, sourceId, subcategoryId } = parseSourceKeyAtlasGeo(input)
    expect(categoryId).toMatch('mapillary')
    expect(sourceId).toMatch('atlas_barriers')
    expect(subcategoryId).toMatch('bikelanes')
  })
})
