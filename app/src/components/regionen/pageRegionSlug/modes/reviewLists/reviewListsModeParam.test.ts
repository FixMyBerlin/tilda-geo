import { describe, expect, test } from 'vitest'
import { compactReviewListsModeParam, zodReviewListsModeParam } from './reviewListsModeParam'

describe('reviewListsModeParam', () => {
  test('parses a flat rl object with key', () => {
    expect(zodReviewListsModeParam.parse({ key: 7, search: 'foo', status: 'OPEN' })).toEqual({
      key: 7,
      search: 'foo',
      status: 'OPEN',
    })
  })

  test('one invalid field is dropped, the rest is kept', () => {
    expect(zodReviewListsModeParam.parse({ key: 7, search: 'foo', status: 'INVALID' })).toEqual({
      key: 7,
      search: 'foo',
    })
  })

  test('compactReviewListsModeParam omits defaults', () => {
    expect(compactReviewListsModeParam({ extent: 'view' })).toBeUndefined()
    expect(compactReviewListsModeParam({ key: 3, extent: 'all', status: 'OK' })).toEqual({
      key: 3,
      extent: 'all',
      status: 'OK',
    })
    expect(compactReviewListsModeParam({ new: true })).toEqual({ new: true })
  })

  test('move: true parses and survives compactReviewListsModeParam', () => {
    expect(zodReviewListsModeParam.parse({ move: true })).toEqual({ move: true })
    expect(compactReviewListsModeParam({ move: true })).toEqual({ move: true })
    expect(compactReviewListsModeParam({ key: 3, move: true })).toEqual({ key: 3, move: true })
  })

  test('falsy or absent move is omitted', () => {
    expect(zodReviewListsModeParam.parse({})).toEqual({})
    expect(compactReviewListsModeParam({})).toBeUndefined()
    expect(compactReviewListsModeParam({ move: undefined })).toBeUndefined()
    expect(compactReviewListsModeParam({ key: 3 })).toEqual({ key: 3 })
  })
})
