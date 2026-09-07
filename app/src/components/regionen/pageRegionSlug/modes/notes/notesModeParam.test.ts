import { describe, expect, test } from 'vitest'
import { compactNotesModeParam, zodNotesModeParam } from './notesModeParam'

describe('notesMode search param', () => {
  test('one invalid field is dropped, the rest is kept', () => {
    expect(
      zodNotesModeParam.parse({ search: 'kreuzung', extent: 'orphaned', completed: false }),
    ).toEqual({ search: 'kreuzung', completed: false })
  })

  test('compactNotesModeParam omits defaults and empty objects', () => {
    expect(compactNotesModeParam({ extent: 'view' })).toBeUndefined()
    expect(compactNotesModeParam({ search: '', extent: 'view' })).toBeUndefined()
    expect(compactNotesModeParam({ completed: false, extent: 'all' })).toEqual({
      completed: false,
      extent: 'all',
    })
    expect(compactNotesModeParam({ key: 'osm', search: 'foo' })).toEqual({
      key: 'osm',
      search: 'foo',
    })
  })
})
