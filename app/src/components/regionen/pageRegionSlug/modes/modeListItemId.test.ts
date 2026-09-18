import { describe, expect, test } from 'vitest'
import { additionalSourceKeys } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import {
  listItemIdFromMapFeature,
  listItemIdFromMapFeatures,
  parseReviewListHoverId,
  qaListItemId,
  reviewHighlightIds,
  reviewListItemId,
} from './modeListItemId'
import { notesListItemId } from './notes/notesListHoverId'

const [osmNotesSourceId, internalNotesSourceId, reviewEntriesSourceId, qaSourceId] =
  additionalSourceKeys

describe('listItemIdFromMapFeature()', () => {
  test('maps OSM and internal notes from feature.id', () => {
    expect(listItemIdFromMapFeature({ source: osmNotesSourceId, id: 42 })).toBe(
      notesListItemId(osmNotesSourceId, 42),
    )
    expect(listItemIdFromMapFeature({ source: internalNotesSourceId, id: 7 })).toBe(
      notesListItemId(internalNotesSourceId, 7),
    )
  })

  test('maps QA and review-list features from feature.id', () => {
    expect(listItemIdFromMapFeature({ source: qaSourceId, id: 'area-1' })).toBe(
      qaListItemId('area-1'),
    )
    expect(listItemIdFromMapFeature({ source: qaSourceId, id: 12 })).toBe(qaListItemId(12))
    expect(listItemIdFromMapFeature({ source: reviewEntriesSourceId, id: 3 })).toBe(
      reviewListItemId(3),
    )
  })

  test('ignores atlas features and missing ids', () => {
    expect(listItemIdFromMapFeature({ source: 'atlas_bikelanes', id: 1 })).toBeNull()
    expect(listItemIdFromMapFeature({ source: osmNotesSourceId, id: undefined })).toBeNull()
    expect(listItemIdFromMapFeature({ source: qaSourceId, id: undefined })).toBeNull()
  })
})

describe('listItemIdFromMapFeatures()', () => {
  test('returns the first mode-owned feature in a mixed hit list', () => {
    expect(
      listItemIdFromMapFeatures([
        { source: 'atlas_bikelanes', id: 1 },
        { source: osmNotesSourceId, id: 42 },
        { source: qaSourceId, id: 'area-1' },
      ]),
    ).toBe(notesListItemId(osmNotesSourceId, 42))
  })

  test('returns null when nothing maps to a list row', () => {
    expect(listItemIdFromMapFeatures(undefined)).toBeNull()
    expect(listItemIdFromMapFeatures([{ source: 'atlas_bikelanes', id: 1 }])).toBeNull()
  })
})

describe('parseReviewListHoverId()', () => {
  test('reads the numeric id', () => {
    expect(parseReviewListHoverId(reviewListItemId(3))).toBe(3)
  })

  test('ignores missing or other-mode ids', () => {
    expect(parseReviewListHoverId(undefined)).toBeNull()
    expect(parseReviewListHoverId('qa-1')).toBeNull()
    expect(parseReviewListHoverId('review-x')).toBeNull()
  })
})

describe('reviewHighlightIds()', () => {
  test('unions selection with list hover and map hover', () => {
    expect(reviewHighlightIds([1, 2], reviewListItemId(3), reviewListItemId(4))).toEqual([
      1, 2, 3, 4,
    ])
  })

  test('ignores hover ids from another mode', () => {
    expect(reviewHighlightIds([1], qaListItemId(9), null)).toEqual([1])
  })
})
