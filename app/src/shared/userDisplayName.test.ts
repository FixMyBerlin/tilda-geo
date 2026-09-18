import { describe, expect, test } from 'vitest'
import { displayNameForOsmUser, formatUserDisplayName } from './userDisplayName'

describe('formatUserDisplayName()', () => {
  test('prefers first and last name', () => {
    expect(
      formatUserDisplayName({ firstName: 'Tobias', lastName: 'Ordans', osmName: 'tordans' }),
    ).toBe('Tobias Ordans')
  })

  test('falls back to the OSM name', () => {
    expect(formatUserDisplayName({ firstName: null, lastName: null, osmName: 'tordans' })).toBe(
      'tordans',
    )
  })

  test('returns undefined when the user is missing', () => {
    expect(formatUserDisplayName(null)).toBeUndefined()
  })
})

describe('displayNameForOsmUser()', () => {
  const members = [{ osmName: 'tordans', firstName: 'Tobias', lastName: 'Ordans' }]

  test('uses the member display name when the OSM user is a member', () => {
    expect(displayNameForOsmUser('tordans', members)).toBe('Tobias Ordans')
  })

  test('keeps the OSM name when the user is not a member', () => {
    expect(displayNameForOsmUser('someone', members)).toBe('someone')
  })
})
