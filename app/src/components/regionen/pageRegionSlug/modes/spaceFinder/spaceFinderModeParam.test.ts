import { describe, expect, test } from 'vitest'
import { compactSpaceFinderModeParam, zodSpaceFinderModeParam } from './spaceFinderModeParam'

describe('spaceFinderModeParam', () => {
  test('parses a flat ff object with key', () => {
    expect(
      zodSpaceFinderModeParam.parse({ key: 7, score: 'bedarf', opacity: 40, minArea: 25 }),
    ).toEqual({
      key: 7,
      score: 'bedarf',
      opacity: 40,
      minArea: 25,
    })
  })

  test('one invalid field is dropped, the rest is kept', () => {
    expect(zodSpaceFinderModeParam.parse({ key: 7, score: 'invalid', opacity: 40 })).toEqual({
      key: 7,
      opacity: 40,
    })
  })

  test('opacity outside 0-100 is dropped', () => {
    expect(zodSpaceFinderModeParam.parse({ key: 7, opacity: 150 })).toEqual({ key: 7 })
    expect(zodSpaceFinderModeParam.parse({ key: 7, opacity: -1 })).toEqual({ key: 7 })
  })

  test('new is area or variant, edit is only area', () => {
    expect(zodSpaceFinderModeParam.parse({ new: 'area' })).toEqual({ new: 'area' })
    expect(zodSpaceFinderModeParam.parse({ new: 'variant' })).toEqual({ new: 'variant' })
    expect(zodSpaceFinderModeParam.parse({ new: 'invalid' })).toEqual({})
    expect(zodSpaceFinderModeParam.parse({ edit: 'area' })).toEqual({ edit: 'area' })
    expect(zodSpaceFinderModeParam.parse({ edit: 'variant' })).toEqual({})
  })

  test('compactSpaceFinderModeParam omits defaults (score kombination, opacity 100, minArea 0)', () => {
    expect(compactSpaceFinderModeParam({ score: 'kombination', opacity: 100, minArea: 0 })).toBe(
      undefined,
    )
    expect(compactSpaceFinderModeParam({ key: 3, score: 'bedarf', opacity: 40 })).toEqual({
      key: 3,
      score: 'bedarf',
      opacity: 40,
    })
  })

  test('compactSpaceFinderModeParam keeps new/edit', () => {
    expect(compactSpaceFinderModeParam({ new: 'area' })).toEqual({ new: 'area' })
    expect(compactSpaceFinderModeParam({ key: 3, edit: 'area' })).toEqual({ key: 3, edit: 'area' })
  })

  test('falsy or absent fields are omitted', () => {
    expect(zodSpaceFinderModeParam.parse({})).toEqual({})
    expect(compactSpaceFinderModeParam({})).toBeUndefined()
    expect(compactSpaceFinderModeParam({ key: undefined })).toBeUndefined()
    expect(compactSpaceFinderModeParam({ key: 3 })).toEqual({ key: 3 })
  })
})
