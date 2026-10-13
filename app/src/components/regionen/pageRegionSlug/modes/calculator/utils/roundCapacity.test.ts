import { describe, expect, test } from 'vitest'
import { roundCapacity } from './roundCapacity'

describe('roundCapacity', () => {
  test.each([
    [0, 0],
    [0.3, 0],
    [4.8, 4],
    [4.9, 5],
    [5, 5],
    [60.6, 60],
    [60.89, 60],
    [60.9, 61],
  ])('%f is %i', (sum, expected) => {
    expect(roundCapacity(sum)).toBe(expected)
  })
})
