import { describe, expect, test } from 'vitest'
import { clampSkipTake, lastPageSkip } from './clampSkipTake'
import { compactPageNumbers } from './compactPageNumbers'
import { ADMIN_DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE, MAX_SKIP } from './constants'
import { createPageSearchSchema, pageSearchDefaults } from './pageSearchSchema'
import { pageToSkipTake } from './pageToSkipTake'
import { toPaginationResult } from './toPaginationResult'

describe('clampSkipTake', () => {
  test('applies defaults and maxTake', () => {
    expect(clampSkipTake(undefined, undefined)).toEqual({ skip: 0, take: ADMIN_DEFAULT_PAGE_SIZE })
    expect(clampSkipTake(-1, 999)).toEqual({ skip: 0, take: MAX_PAGE_SIZE })
    expect(clampSkipTake(100, 25, { defaultTake: 25 })).toEqual({ skip: 100, take: 25 })
  })

  test('caps skip and rejects non-finite values', () => {
    expect(clampSkipTake(MAX_SKIP + 1, 50)).toEqual({ skip: MAX_SKIP, take: 50 })
    expect(clampSkipTake(Number.POSITIVE_INFINITY, Number.NaN)).toEqual({
      skip: 0,
      take: ADMIN_DEFAULT_PAGE_SIZE,
    })
  })
})

describe('lastPageSkip', () => {
  test('returns the skip of the last page', () => {
    expect(lastPageSkip(0, 50)).toBe(0)
    expect(lastPageSkip(1, 50)).toBe(0)
    expect(lastPageSkip(50, 50)).toBe(0)
    expect(lastPageSkip(51, 50)).toBe(50)
    expect(lastPageSkip(651, 50)).toBe(650)
  })
})

describe('pageToSkipTake', () => {
  test('converts 1-based pages to skip/take', () => {
    expect(pageToSkipTake({ page: 1, pageSize: 50 })).toEqual({ skip: 0, take: 50 })
    expect(pageToSkipTake({ page: 3, pageSize: 25 })).toEqual({ skip: 50, take: 25 })
  })

  test('treats page 0 and negative pages as the first page', () => {
    expect(pageToSkipTake({ page: 0, pageSize: 50 })).toEqual({ skip: 0, take: 50 })
    expect(pageToSkipTake({ page: -4, pageSize: 50 })).toEqual({ skip: 0, take: 50 })
    expect(pageToSkipTake({ page: 2, pageSize: 0 })).toEqual({ skip: 1, take: 1 })
  })

  test('caps skip so a huge page cannot overflow', () => {
    expect(pageToSkipTake({ page: Number.MAX_SAFE_INTEGER, pageSize: MAX_PAGE_SIZE }).skip).toBe(
      MAX_SKIP,
    )
  })
})

describe('createPageSearchSchema', () => {
  const schema = createPageSearchSchema()

  test('applies defaults for an empty search', () => {
    expect(schema.parse({})).toEqual(pageSearchDefaults)
  })

  test('parses valid wire values', () => {
    expect(schema.parse({ page: '3', pageSize: '20' })).toEqual({ page: 3, pageSize: 20 })
  })

  test('falls back to defaults for invalid values instead of throwing', () => {
    expect(schema.parse({ page: 'abc' })).toEqual(pageSearchDefaults)
    expect(schema.parse({ page: 0 })).toEqual(pageSearchDefaults)
    expect(schema.parse({ page: -1 })).toEqual(pageSearchDefaults)
    expect(schema.parse({ page: 1.5 })).toEqual(pageSearchDefaults)
    expect(schema.parse({ pageSize: 999 })).toEqual(pageSearchDefaults)
    expect(schema.parse({ pageSize: 0 })).toEqual(pageSearchDefaults)
    expect(schema.parse({ page: MAX_PAGE + 1 })).toEqual(pageSearchDefaults)
  })
})

describe('toPaginationResult', () => {
  test('computes display range, hasMore, page and pageCount', () => {
    expect(toPaginationResult({ skip: 0, take: 50, total: 651, rowCount: 50 })).toEqual({
      from: 1,
      to: 50,
      count: 651,
      hasMore: true,
      page: 1,
      pageCount: 14,
    })

    expect(toPaginationResult({ skip: 650, take: 50, total: 651, rowCount: 1 })).toEqual({
      from: 651,
      to: 651,
      count: 651,
      hasMore: false,
      page: 14,
      pageCount: 14,
    })

    expect(toPaginationResult({ skip: 50, take: 50, total: 100, rowCount: 50 })).toEqual({
      from: 51,
      to: 100,
      count: 100,
      hasMore: false,
      page: 2,
      pageCount: 2,
    })
  })

  test('handles an empty list', () => {
    expect(toPaginationResult({ skip: 0, take: 50, total: 0, rowCount: 0 })).toEqual({
      from: 0,
      to: 0,
      count: 0,
      hasMore: false,
      page: 1,
      pageCount: 0,
    })
  })
})

describe('compactPageNumbers', () => {
  test('shows every page up to 7 pages', () => {
    expect(compactPageNumbers(1, 0)).toEqual([])
    expect(compactPageNumbers(1, 1)).toEqual([1])
    expect(compactPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test('collapses distant pages into gaps', () => {
    expect(compactPageNumbers(1, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12])
    expect(compactPageNumbers(4, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12])
    expect(compactPageNumbers(5, 12)).toEqual([1, 'gap', 4, 5, 6, 'gap', 12])
    expect(compactPageNumbers(9, 12)).toEqual([1, 'gap', 8, 9, 10, 11, 12])
    expect(compactPageNumbers(12, 12)).toEqual([1, 'gap', 8, 9, 10, 11, 12])
  })

  test('clamps an out-of-range page', () => {
    expect(compactPageNumbers(99, 12)).toEqual([1, 'gap', 8, 9, 10, 11, 12])
  })
})
