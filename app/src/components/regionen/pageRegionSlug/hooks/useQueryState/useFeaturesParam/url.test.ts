import { describe, expect, test } from 'vitest'
import { sources } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { additionalSourceKeys, numericSourceIds } from './url'

describe('Test data required for url decoding', () => {
  test('url.ts: Must specify a numericSourceId for every source (mainly sources.const)', () => {
    const requiredSourceIds = Object.values(numericSourceIds)
    sources.forEach((source) => {
      expect(requiredSourceIds).toContain(source.id)
    })
  })
  test('url.ts: Must only have sourceIds that are currently part of sources.const', () => {
    const sourceIds = sources.map((s) => s.id)
    Object.values(numericSourceIds)
      // 'osm-notes' is the expection to this rule, so we skip it here
      .filter((id) => !additionalSourceKeys.includes(id))
      .forEach((numericSourceId) => {
        expect(sourceIds).toContain(numericSourceId)
      })
  })
})
