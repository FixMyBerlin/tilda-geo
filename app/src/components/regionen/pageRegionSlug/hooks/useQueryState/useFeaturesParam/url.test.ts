import { describe, expect, test } from 'vitest'
import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { qaSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
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
  test('url.ts: additionalSourceKeys match the mode layer source ids', () => {
    expect([...additionalSourceKeys]).toEqual([
      osmNotesSourceId,
      internalNotesSourceId,
      reviewEntriesSourceId,
      qaSourceId,
    ])
  })
})
