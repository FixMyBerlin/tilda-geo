import { describe, expect, test } from 'vitest'
import { splitSemicolonRespectingBrackets } from './splitSemicolonRespectingBrackets'

describe('splitSemicolonRespectingBrackets', () => {
  test('splits simple semicolon-separated values', () => {
    const input = 'foo;bar;bz'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo', 'bar', 'bz'])
  })

  test('does not split semicolons inside parentheses', () => {
    const input = 'foo (a; b; c)'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo (a; b; c)'])
  })

  test('splits partially when semicolons are both inside and outside brackets', () => {
    const input = 'foo;bar (A; B; C);bz'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo', 'bar (A; B; C)', 'bz'])
  })

  test('handles empty string', () => {
    const result = splitSemicolonRespectingBrackets('')
    expect(result).toEqual([])
  })

  test('handles string with only whitespace', () => {
    const result = splitSemicolonRespectingBrackets('   ')
    expect(result).toEqual([])
  })

  test('handles trailing semicolon', () => {
    const input = 'foo;bar;'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo', 'bar'])
  })

  test('handles leading semicolon', () => {
    const input = ';foo;bar'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo', 'bar'])
  })

  test('handles multiple spaces around semicolons', () => {
    const input = 'foo  ;  bar  ;  bz'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['foo', 'bar', 'bz'])
  })

  test('real-world example: parking condition with time restrictions', () => {
    const input = 'no_stopping (Mo-Fr 07:00-18:00; Sa 09:00-14:00);no_parking'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['no_stopping (Mo-Fr 07:00-18:00; Sa 09:00-14:00)', 'no_parking'])
  })

  test('handles multiple items with brackets', () => {
    const input = 'item1 (a; b);item2 (c; d);item3'
    const result = splitSemicolonRespectingBrackets(input)
    expect(result).toEqual(['item1 (a; b)', 'item2 (c; d)', 'item3'])
  })

  test('handles unclosed parentheses by splitting normally', () => {
    const input = 'foo (a; b;bar'
    const result = splitSemicolonRespectingBrackets(input)
    // Malformed input: splits at semicolons since parentheses aren't closed
    expect(result).toEqual(['foo (a', 'b', 'bar'])
  })
})
