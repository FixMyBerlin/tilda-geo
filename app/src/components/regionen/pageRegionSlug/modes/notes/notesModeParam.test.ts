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
    expect(compactNotesModeParam({ key: 3, search: 'foo' })).toEqual({
      key: 3,
      search: 'foo',
    })
  })

  test('numeric and osm keys round-trip; other strings are dropped', () => {
    expect(zodNotesModeParam.parse({ key: 3 })).toEqual({ key: 3 })
    expect(compactNotesModeParam({ key: 3 })).toEqual({ key: 3 })
    expect(zodNotesModeParam.parse({ key: 'osm', search: 'foo' })).toEqual({
      key: 'osm',
      search: 'foo',
    })
    expect(compactNotesModeParam({ key: 'osm' })).toEqual({ key: 'osm' })
    expect(zodNotesModeParam.parse({ key: 'folder', search: 'foo' })).toEqual({ search: 'foo' })
  })

  test('compactNotesModeParam keeps a compose pin on new', () => {
    expect(compactNotesModeParam({ new: '18/52.5/13.4' })).toEqual({ new: '18/52.5/13.4' })
    expect(compactNotesModeParam({ new: '' })).toBeUndefined()
  })

  test('invalid new is dropped, other fields kept', () => {
    expect(zodNotesModeParam.parse({ search: 'kreuzung', new: true })).toEqual({
      search: 'kreuzung',
    })
  })
})
