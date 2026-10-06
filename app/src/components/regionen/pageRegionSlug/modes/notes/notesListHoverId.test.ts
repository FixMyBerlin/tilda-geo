import { describe, expect, test } from 'vitest'
import { notesHighlightIds, notesListItemId, parseNotesListHoverId } from './notesListHoverId'

describe('parseNotesListHoverId()', () => {
  test('reads the numeric id for the matching source', () => {
    expect(
      parseNotesListHoverId(notesListItemId('internal-notes-source', 42), 'internal-notes-source'),
    ).toBe(42)
  })

  test('ignores a row from another notes source', () => {
    expect(
      parseNotesListHoverId(notesListItemId('osm-notes-source', 42), 'internal-notes-source'),
    ).toBeNull()
  })

  test('ignores missing or malformed ids', () => {
    expect(parseNotesListHoverId(undefined, 'internal-notes-source')).toBeNull()
    expect(
      parseNotesListHoverId('note-internal-notes-source-x', 'internal-notes-source'),
    ).toBeNull()
    expect(parseNotesListHoverId('qa-1', 'internal-notes-source')).toBeNull()
  })
})

describe('notesHighlightIds()', () => {
  const sourceId = 'osm-notes-source'

  test('unions selection with list hover and map hover', () => {
    expect(
      notesHighlightIds(
        [1, 2],
        notesListItemId(sourceId, 3),
        notesListItemId(sourceId, 4),
        sourceId,
      ),
    ).toEqual([1, 2, 3, 4])
  })

  test('ignores hover ids from another source', () => {
    expect(
      notesHighlightIds([1], notesListItemId('internal-notes-source', 9), null, sourceId),
    ).toEqual([1])
  })
})
