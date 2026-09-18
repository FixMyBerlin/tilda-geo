import { describe, expect, test } from 'vitest'
import { optionalTrimmed, searchTerms } from './searchString'

describe('optionalTrimmed', () => {
  test('treats missing and whitespace as undefined', () => {
    expect(optionalTrimmed()).toBeUndefined()
    expect(optionalTrimmed('')).toBeUndefined()
    expect(optionalTrimmed('   ')).toBeUndefined()
  })

  test('trims a real value', () => {
    expect(optionalTrimmed('  bb  ')).toBe('bb')
  })
})

describe('searchTerms', () => {
  test('splits on whitespace and drops blanks', () => {
    expect(searchTerms()).toEqual([])
    expect(searchTerms('   ')).toEqual([])
    expect(searchTerms('  Anna   Müller ')).toEqual(['Anna', 'Müller'])
  })
})
