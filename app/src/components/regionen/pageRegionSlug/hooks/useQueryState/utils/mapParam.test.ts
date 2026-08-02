import { describe, expect, test } from 'vitest'
import { parseMapParam, serializeMapParam } from './mapParam'

describe('parseMapParam()', () => {
  test('parses 3-part map param', () => {
    expect(parseMapParam('13/48.1/9.2')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
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

  test('parses zero bearing and pitch', () => {
    expect(parseMapParam('13/48.1/9.2/0/0')).toStrictEqual({
      zoom: 13,
      lat: 48.1,
      lng: 9.2,
      bearing: 0,
      pitch: 0,
    })
  })

  test('rejects wrong length or invalid camera', () => {
    expect(parseMapParam('13/48.1/9.2/45')).toBeNull()
    expect(parseMapParam('13/48.1/9.2/foo/60')).toBeNull()
    expect(parseMapParam('13/48.1/9.2/45/foo')).toBeNull()
    expect(parseMapParam('13/48.1/9.2/45/60/99')).toBeNull()
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
  test('serializes without camera as 3-part', () => {
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2 })).toBe('13/48.1/9.2')
  })

  test('serializes bearing and pitch only when both present', () => {
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 0, pitch: 0 })).toBe(
      '13/48.1/9.2/0/0',
    )
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45, pitch: 0 })).toBe(
      '13/48.1/9.2/45/0',
    )
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45, pitch: 60 })).toBe(
      '13/48.1/9.2/45/60',
    )
    expect(serializeMapParam({ zoom: 13, lat: 48.1, lng: 9.2, bearing: 45 })).toBe('13/48.1/9.2')
  })
})
