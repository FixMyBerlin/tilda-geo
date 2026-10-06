import { describe, expect, test } from 'vitest'
import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { qaSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import {
  filterInspectorFeaturesForMode,
  filterUrlFeaturesForMode,
  isModeOwnedSource,
  isSelectionSourceAllowedInMode,
  modeForSource,
} from './modeScopedSelection'

describe('modeScopedSelection', () => {
  test('atlas sources stay allowed in every mode', () => {
    expect(isSelectionSourceAllowedInMode('atlas_bikelanes', 'map')).toBe(true)
    expect(isSelectionSourceAllowedInMode('atlas_bikelanes', 'notes')).toBe(true)
    expect(isModeOwnedSource('atlas_bikelanes')).toBe(false)
    expect(modeForSource('atlas_bikelanes')).toBeUndefined()
  })

  test('notes sources are only allowed in notes mode', () => {
    expect(isSelectionSourceAllowedInMode(osmNotesSourceId, 'notes')).toBe(true)
    expect(isSelectionSourceAllowedInMode(osmNotesSourceId, 'map')).toBe(false)
    expect(isSelectionSourceAllowedInMode(osmNotesSourceId, 'qa')).toBe(false)
    expect(isSelectionSourceAllowedInMode(osmNotesSourceId, 'reviewLists')).toBe(false)
    expect(isSelectionSourceAllowedInMode(internalNotesSourceId, 'notes')).toBe(true)
    expect(isSelectionSourceAllowedInMode(internalNotesSourceId, 'map')).toBe(false)
    expect(isModeOwnedSource(osmNotesSourceId)).toBe(true)
    expect(isModeOwnedSource(internalNotesSourceId)).toBe(true)
    expect(modeForSource(osmNotesSourceId)).toBe('notes')
    expect(modeForSource(internalNotesSourceId)).toBe('notes')
  })

  test('review entries are only allowed in reviewLists mode', () => {
    expect(isSelectionSourceAllowedInMode(reviewEntriesSourceId, 'reviewLists')).toBe(true)
    expect(isSelectionSourceAllowedInMode(reviewEntriesSourceId, 'map')).toBe(false)
    expect(isSelectionSourceAllowedInMode(reviewEntriesSourceId, 'notes')).toBe(false)
    expect(isSelectionSourceAllowedInMode(reviewEntriesSourceId, 'qa')).toBe(false)
  })

  test('qa features are only allowed in qa mode', () => {
    expect(isSelectionSourceAllowedInMode(qaSourceId, 'qa')).toBe(true)
    expect(isSelectionSourceAllowedInMode(qaSourceId, 'map')).toBe(false)
    expect(isSelectionSourceAllowedInMode(qaSourceId, 'reviewLists')).toBe(false)
  })

  test('filterInspectorFeaturesForMode drops notes outside notes mode', () => {
    const features = [
      { source: osmNotesSourceId, id: 1 },
      { source: reviewEntriesSourceId, id: 2 },
      { source: 'atlas_bikelanes', id: 3 },
    ]

    expect(filterInspectorFeaturesForMode(features, 'notes').map((f) => f.id)).toEqual([1, 3])
    expect(filterInspectorFeaturesForMode(features, 'reviewLists').map((f) => f.id)).toEqual([2, 3])
    expect(filterInspectorFeaturesForMode(features, 'map').map((f) => f.id)).toEqual([3])
  })

  test('filterUrlFeaturesForMode drops mode-scoped sourceIds outside their mode', () => {
    const features = [
      { sourceId: osmNotesSourceId, id: 1 },
      { sourceId: reviewEntriesSourceId, id: 2 },
      { sourceId: qaSourceId, id: 3 },
    ]

    expect(filterUrlFeaturesForMode(features, 'map').map((f) => f.id)).toEqual([])
    expect(filterUrlFeaturesForMode(features, 'qa').map((f) => f.id)).toEqual([3])
    expect(filterUrlFeaturesForMode(features, 'notes').map((f) => f.id)).toEqual([1])
  })
})
