import { describe, expect, test } from 'vitest'
import { formatUserName, formatUserNameWithOsmHandle } from './formatUserName'

const anna = { firstName: 'Anna', lastName: 'Muster', osmName: '95gasann' }

describe('formatUserName', () => {
  test('prefers first + last name over OSM username', () => {
    expect(formatUserName(anna)).toBe('Anna Muster')
  })

  test('falls back to OSM username when name is empty', () => {
    expect(formatUserName({ firstName: null, lastName: null, osmName: '95gasann' })).toBe(
      '95gasann',
    )
  })

  test('returns em dash when nothing is set', () => {
    expect(formatUserName({ firstName: null, lastName: null, osmName: null })).toBe('—')
  })
})

describe('formatUserNameWithOsmHandle', () => {
  test('appends OSM handle in parentheses when a real name exists', () => {
    expect(formatUserNameWithOsmHandle(anna)).toBe('Anna Muster (95gasann)')
  })

  test('falls back to OSM username when name is empty', () => {
    expect(
      formatUserNameWithOsmHandle({ firstName: null, lastName: null, osmName: '95gasann' }),
    ).toBe('95gasann')
  })
})
