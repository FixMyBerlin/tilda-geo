import { describe, expect, test } from 'vitest'
import {
  OSM_NOTES_BBOX_LIMIT,
  osmNotesBboxPath,
  osmNotesHitBboxLimit,
} from './osmNotesQueryOptions'

describe('OSM notes bbox fetch cap', () => {
  test('requests the API default limit of 100', () => {
    expect(OSM_NOTES_BBOX_LIMIT).toBe(100)
    expect(osmNotesBboxPath('13.4,52.5,13.5,52.6')).toBe(
      '/notes.json?bbox=13.4,52.5,13.5,52.6&limit=100',
    )
  })

  test('treats a full page as the bbox cap (the JSON body has no truncated flag)', () => {
    expect(osmNotesHitBboxLimit(99)).toBe(false)
    expect(osmNotesHitBboxLimit(100)).toBe(true)
    expect(osmNotesHitBboxLimit(101)).toBe(true)
  })
})
