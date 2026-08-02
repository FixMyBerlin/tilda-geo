import { describe, expect, test } from 'vitest'
import {
  is3dActive,
  is3dBuildingActive,
  is3dTerrainActive,
  parseBg3dParam,
  serializeBg3dParam,
} from './bg3dParam'

describe('parseBg3dParam()', () => {
  test('parses CSV modules in canonical order', () => {
    expect(parseBg3dParam('terrain,buildings')).toEqual(['buildings', 'terrain'])
    expect(parseBg3dParam('buildings,terrain')).toEqual(['buildings', 'terrain'])
  })

  test('dedupes modules', () => {
    expect(parseBg3dParam('buildings,buildings,terrain')).toEqual(['buildings', 'terrain'])
  })

  test('filters unknown values', () => {
    expect(parseBg3dParam('buildings,foo,terrain,bar')).toEqual(['buildings', 'terrain'])
  })

  test('returns empty for missing or empty input', () => {
    expect(parseBg3dParam(undefined)).toEqual([])
    expect(parseBg3dParam('')).toEqual([])
    expect(parseBg3dParam(' , ')).toEqual([])
  })
})

describe('serializeBg3dParam()', () => {
  test('serializes canonical order', () => {
    expect(serializeBg3dParam(['terrain', 'buildings'])).toBe('buildings,terrain')
  })

  test('omits empty modules', () => {
    expect(serializeBg3dParam([])).toBeUndefined()
  })
})

describe('bg3d helper booleans', () => {
  test('reflects active modules', () => {
    const modules = parseBg3dParam('terrain')
    expect(is3dBuildingActive(modules)).toBe(false)
    expect(is3dTerrainActive(modules)).toBe(true)
    expect(is3dActive(modules)).toBe(true)
  })
})
