import { describe, expect, test } from 'vitest'
import {
  hasContactEmail,
  isContactProfileIncomplete,
  isOsmPlaceholderEmail,
  osmPlaceholderEmail,
} from './osmPlaceholderEmail'

describe('isOsmPlaceholderEmail', () => {
  test('returns true for OSM synthetic address', () => {
    expect(isOsmPlaceholderEmail('osm-123@users.openstreetmap.invalid')).toBe(true)
  })

  test('returns false for real addresses', () => {
    expect(isOsmPlaceholderEmail('a@b.de')).toBe(false)
    expect(isOsmPlaceholderEmail('user@example.com')).toBe(false)
  })

  test('returns false for nullish', () => {
    expect(isOsmPlaceholderEmail(null)).toBe(false)
    expect(isOsmPlaceholderEmail(undefined)).toBe(false)
    expect(isOsmPlaceholderEmail('')).toBe(false)
  })
})

describe('hasContactEmail', () => {
  test('false for placeholder', () => {
    expect(hasContactEmail(osmPlaceholderEmail(1))).toBe(false)
  })

  test('true for non-placeholder', () => {
    expect(hasContactEmail('hello@fixmycity.de')).toBe(true)
  })

  test('false for empty', () => {
    expect(hasContactEmail(null)).toBe(false)
    expect(hasContactEmail('')).toBe(false)
  })
})

describe('isContactProfileIncomplete', () => {
  test('incomplete without contact email', () => {
    expect(
      isContactProfileIncomplete({
        email: osmPlaceholderEmail(1),
        firstName: 'A',
        lastName: 'B',
      }),
    ).toBe(true)
  })

  test('incomplete without names', () => {
    expect(
      isContactProfileIncomplete({
        email: 'a@b.de',
        firstName: '',
        lastName: 'B',
      }),
    ).toBe(true)
    expect(
      isContactProfileIncomplete({
        email: 'a@b.de',
        firstName: 'A',
        lastName: null,
      }),
    ).toBe(true)
  })

  test('complete when all set', () => {
    expect(
      isContactProfileIncomplete({
        email: 'a@b.de',
        firstName: 'A',
        lastName: 'B',
      }),
    ).toBe(false)
  })
})
