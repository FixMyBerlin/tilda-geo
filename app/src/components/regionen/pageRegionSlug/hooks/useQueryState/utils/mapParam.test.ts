import { describe, expect, test } from 'vitest'
import { parseMapParam, serializeMapParam } from './mapParam'

describe('parseMapParam()', () => {
  test('parses 3-part map param', () => {
    expect(parseMapParam('13/48.1/9.2')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
  })

  test('parses 4-part map param with bearing only', () => {
    expect(parseMapParam('13/48.1/9.2/45')).toStrictEqual({
      zoom: 13,
      lat: 48.1,
      lng: 9.2,
      bearing: 45,
    })
  })

  test('parses 5-part map param with bearing and pitch', () => {
    expect(parseMapParam('13/48.1/9.2/45/60')).toStrictEqual({
      zoom: 13,
      lat: 48.1,
      lng: 9.2,
      bearing: 45,
      pitch: 60,
    })
  })

  test('falls back to core triplet on invalid trailing camera values', () => {
    expect(parseMapParam('13/48.1/9.2/foo')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
    expect(parseMapParam('13/48.1/9.2/45/foo')).toStrictEqual({
      zoom: 13,
      lat: 48.1,
      lng: 9.2,
      bearing: 45,
    })
  })

  test('ignores placeholder camera fragments', () => {
    expect(parseMapParam('13/48.1/9.2/0')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
    expect(parseMapParam('13/48.1/9.2/0/0')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
    expect(parseMapParam('13/48.1/9.2/none/none')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
  })

  test('rejects invalid core map values', () => {
    expect(parseMapParam('some-string')).toBeNull()
    expect(parseMapParam('@52.8,13.6,12.5z')).toBeNull()
    expect(parseMapParam('@some-stringz')).toBeNull()
    const testZoom = (zoom: string) => expect(parseMapParam(`${zoom}/48.1/9.2`)).toBeNull()
    const testLat = (lat: string) => expect(parseMapParam(`13/${lat}/9.2`)).toBeNull()
    const testLng = (lng: string) => expect(parseMapParam(`13/48.1/${lng}`)).toBeNull()
    testZoom('3foo3')
    testZoom('-1')
    testZoom('23')
    testLat('bar48')
    testLat('-90.1')
    testLat('90.1')
    testLng('bar48')
    testLng('-180.1')
    testLng('180.1')
  })
})

describe('serializeMapParam()', () => {
  test('serializes neutral camera as 3-part', () => {
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2 })).toBe('13/48.1/9.2')
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 0, pitch: 0 })).toBe(
      '13/48.1/9.2',
    )
  })

  test('never serializes synthetic /0/0 placeholders', () => {
    const neutralVariants = [
      { zoom: 13, lat: 48.1, lng: 9.2 },
      { zoom: 13, lat: 48.1, lng: 9.2, bearing: 0 },
      { zoom: 13, lat: 48.1, lng: 9.2, pitch: 0 },
      { zoom: 13, lat: 48.1, lng: 9.2, bearing: 0, pitch: 0 },
    ] as const

    for (const mapParam of neutralVariants) {
      expect(serializeMapParam(mapParam)).toBe('13/48.1/9.2')
      expect(serializeMapParam(mapParam)).not.toMatch(/\/0\/0$/)
    }
  })

  test('serializes rotated-but-flat camera as bearing/0', () => {
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45, pitch: 0 })).toBe(
      '13/48.1/9.2/45/0',
    )
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45 })).toBe(
      '13/48.1/9.2/45/0',
    )
  })

  test('serializes bearing and pitch when both non-neutral', () => {
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45, pitch: 60 })).toBe(
      '13/48.1/9.2/45/60',
    )
  })

  test('round-trips Rapid-like 4-part inbound URLs', () => {
    const parsed = parseMapParam('13/48.1/9.2/45')
    expect(parsed).not.toBeNull()
    expect(serializeMapParam(parsed!)).toBe('13/48.1/9.2/45/0')
  })
})
