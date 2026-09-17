import { describe, expect, test } from 'vitest'
import { noteHighlightFilter } from './noteSelectRingPaint'

describe('noteHighlightFilter()', () => {
  test('matches nothing when empty', () => {
    expect(noteHighlightFilter([])).toEqual(['literal', false])
  })

  test('matches a single id with ==', () => {
    expect(noteHighlightFilter([7])).toEqual(['==', ['get', 'id'], 7])
  })

  test('dedupes and uses in for several ids', () => {
    expect(noteHighlightFilter([1, 1, 2])).toEqual(['in', 'id', 1, 2])
  })
})
