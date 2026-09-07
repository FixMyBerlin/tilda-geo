import { describe, expect, test } from 'vitest'
import { resolveNotesSelection } from './notesSelection'

describe('resolveNotesSelection()', () => {
  test('internal-notes region → internal', () => {
    expect(resolveNotesSelection({ hasInternalNotes: true, hasOsmNotes: false })).toEqual({
      kind: 'internal',
    })
  })

  test('OSM-only region → osm', () => {
    expect(resolveNotesSelection({ hasInternalNotes: false, hasOsmNotes: true })).toEqual({
      kind: 'osm',
    })
  })

  test('neither kind → none', () => {
    expect(resolveNotesSelection({ hasInternalNotes: false, hasOsmNotes: false })).toEqual({
      kind: 'none',
    })
  })

  test('both flags (legacy) → internal', () => {
    expect(resolveNotesSelection({ hasInternalNotes: true, hasOsmNotes: true })).toEqual({
      kind: 'internal',
    })
  })
})
