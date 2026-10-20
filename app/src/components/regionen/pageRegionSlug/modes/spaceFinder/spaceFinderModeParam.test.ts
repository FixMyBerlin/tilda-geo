import { describe, expect, test } from 'vitest'
import {
  appliedMinAreaM2,
  compactSpaceFinderModeParam,
  isSpaceFinderAreaFormOpen,
  zodSpaceFinderModeParam,
} from './spaceFinderModeParam'

describe('spaceFinderModeParam', () => {
  test('parses a flat space object with key', () => {
    expect(
      zodSpaceFinderModeParam.parse({ key: 7, score: 'bedarf', opacity: 40, minArea: true }),
    ).toEqual({
      key: 7,
      score: 'bedarf',
      opacity: 40,
      minArea: true,
    })
  })

  test('a numeric minArea is dropped; the square meters live on the variant', () => {
    expect(zodSpaceFinderModeParam.parse({ key: 7, minArea: 25 })).toEqual({ key: 7 })
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

  test('new and edit are only area', () => {
    expect(zodSpaceFinderModeParam.parse({ new: 'area' })).toEqual({ new: 'area' })
    // A new Variante is a modal now; old bookmarks with `new: 'variant'` just drop the field.
    expect(zodSpaceFinderModeParam.parse({ new: 'variant' })).toEqual({})
    expect(zodSpaceFinderModeParam.parse({ new: 'invalid' })).toEqual({})
    expect(zodSpaceFinderModeParam.parse({ edit: 'area' })).toEqual({ edit: 'area' })
    expect(zodSpaceFinderModeParam.parse({ edit: 'variant' })).toEqual({})
  })

  test('compactSpaceFinderModeParam omits defaults (score kombination, opacity 100, minArea off)', () => {
    expect(compactSpaceFinderModeParam({ score: 'kombination', opacity: 100 })).toBe(undefined)
    expect(
      compactSpaceFinderModeParam({ key: 3, score: 'bedarf', opacity: 40, minArea: true }),
    ).toEqual({
      key: 3,
      score: 'bedarf',
      opacity: 40,
      minArea: true,
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

  test('appliedMinAreaM2 uses the draft while typing and the saved value otherwise', () => {
    expect(appliedMinAreaM2(false, 40, 25)).toBe(0)
    expect(appliedMinAreaM2(true, 40, null)).toBe(40)
    expect(appliedMinAreaM2(true, 40, 25)).toBe(25)
    expect(appliedMinAreaM2(true, 40, 0)).toBe(0)
    expect(appliedMinAreaM2(true, null, null)).toBe(0)
  })

  test('isSpaceFinderAreaFormOpen only for creating or editing a Planungsgebiet', () => {
    expect(isSpaceFinderAreaFormOpen({ key: 3, new: 'area' })).toBe(true)
    expect(isSpaceFinderAreaFormOpen({ key: 3, edit: 'area' })).toBe(true)
    expect(isSpaceFinderAreaFormOpen({ key: 3 })).toBe(false)
  })
})
