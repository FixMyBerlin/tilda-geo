import { describe, expect, test } from 'vitest'
import { parseMapParam } from './mapParam'

describe('parseMapParam()', () => {
  test('Test parseMapParam()', () => {
    expect(parseMapParam('13/48.1/9.2')).toStrictEqual({ zoom: 13, lat: 48.1, lng: 9.2 })
    expect(parseMapParam('some-string')).toBeNull()
    expect(parseMapParam('@52.8,13.6,12.5z')).toBeNull()
    expect(parseMapParam('@some-stringz')).toBeNull()
    const testZoom = (zoom) => expect(parseMapParam(`${zoom}/48.1/9.2`)).toBeNull()
    const testLat = (lat) => expect(parseMapParam(`13/${lat}/9.2`)).toBeNull()
    const testLng = (lng) => expect(parseMapParam(`13/48.1/${lng}`)).toBeNull()
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
