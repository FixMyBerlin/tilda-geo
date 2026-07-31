import { describe, expect, test } from 'vitest'
import { clampSkipTake } from './clampSkipTake'
import { toPaginationResult } from './toPaginationResult'

describe('clampSkipTake', () => {
  test('applies defaults and maxTake', () => {
    expect(clampSkipTake(undefined, undefined)).toEqual({ skip: 0, take: 50 })
    expect(clampSkipTake(-1, 999, { maxTake: 200 })).toEqual({ skip: 0, take: 200 })
    expect(clampSkipTake(100, 25, { defaultTake: 25 })).toEqual({ skip: 100, take: 25 })
  })
})

describe('toPaginationResult', () => {
  test('computes display range and hasMore', () => {
    expect(toPaginationResult({ skip: 0, take: 50, total: 651, rowCount: 50 })).toEqual({
      from: 1,
      to: 50,
      count: 651,
      hasMore: true,
    })

    expect(toPaginationResult({ skip: 650, take: 50, total: 651, rowCount: 1 })).toEqual({
      from: 651,
      to: 651,
      count: 651,
      hasMore: false,
    })

    expect(toPaginationResult({ skip: 0, take: 50, total: 0, rowCount: 0 })).toEqual({
      from: 0,
      to: 0,
      count: 0,
      hasMore: false,
    })
  })
})
