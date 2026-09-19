import { describe, expect, test } from 'vitest'
import { notesOsmCollectionKey } from './notesModeParam'
import {
  compactNotesCollectionKey,
  resolveNotesSelection,
  resolveSelectedNoteFolderId,
} from './notesSelection'

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

  test('both flags default to internal (first folder)', () => {
    expect(resolveNotesSelection({ hasInternalNotes: true, hasOsmNotes: true })).toEqual({
      kind: 'internal',
    })
  })

  test('both flags + key osm → osm', () => {
    expect(
      resolveNotesSelection({
        hasInternalNotes: true,
        hasOsmNotes: true,
        key: notesOsmCollectionKey,
      }),
    ).toEqual({ kind: 'osm' })
  })

  test('stale osm key on an internal-only region → internal', () => {
    expect(
      resolveNotesSelection({
        hasInternalNotes: true,
        hasOsmNotes: false,
        key: notesOsmCollectionKey,
      }),
    ).toEqual({ kind: 'internal' })
  })

  test('stale folder key on an OSM-only region → osm', () => {
    expect(resolveNotesSelection({ hasInternalNotes: false, hasOsmNotes: true, key: 12 })).toEqual({
      kind: 'osm',
    })
  })
})

describe('compactNotesCollectionKey()', () => {
  test('omits OSM when TILDA is off', () => {
    expect(
      compactNotesCollectionKey({
        selected: notesOsmCollectionKey,
        firstFolderId: 1,
        hasOsmAndInternal: false,
      }),
    ).toBeUndefined()
  })

  test('writes osm when both sources are on', () => {
    expect(
      compactNotesCollectionKey({
        selected: notesOsmCollectionKey,
        firstFolderId: 1,
        hasOsmAndInternal: true,
      }),
    ).toBe(notesOsmCollectionKey)
  })

  test('omits the first folder id', () => {
    expect(
      compactNotesCollectionKey({
        selected: 1,
        firstFolderId: 1,
        hasOsmAndInternal: true,
      }),
    ).toBeUndefined()
  })

  test('keeps a later folder id', () => {
    expect(
      compactNotesCollectionKey({
        selected: 2,
        firstFolderId: 1,
        hasOsmAndInternal: false,
      }),
    ).toBe(2)
  })
})

describe('resolveSelectedNoteFolderId()', () => {
  const folders = [{ id: 1 }, { id: 2 }, { id: 3 }]

  test('key matching a folder is kept', () => {
    expect(resolveSelectedNoteFolderId(2, folders)).toBe(2)
  })

  test('undefined key falls back to the first folder', () => {
    expect(resolveSelectedNoteFolderId(undefined, folders)).toBe(1)
  })

  test('stale/deleted key falls back to the first folder', () => {
    expect(resolveSelectedNoteFolderId(99, folders)).toBe(1)
  })

  test('osm key is not a folder id', () => {
    expect(resolveSelectedNoteFolderId(notesOsmCollectionKey, folders)).toBeUndefined()
  })

  test('no folders → undefined', () => {
    expect(resolveSelectedNoteFolderId(undefined, [])).toBeUndefined()
    expect(resolveSelectedNoteFolderId(1, [])).toBeUndefined()
  })
})
