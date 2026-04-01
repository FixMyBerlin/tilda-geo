import { describe, expect, test } from 'vitest'
import { _flattenFilter, wrapFilterWithAll } from './wrapFilterWithAll'

describe('wrapFilterWithAll()', () => {
  test('"undefined" input returns an empty "all" wrapper', () => {
    const filterArray = undefined
    const result = wrapFilterWithAll(filterArray)
    expect(result).toMatchObject(['all'])
  })

  test('input with all returns the same input (including null guard)', () => {
    const filter1 = ['==', 'id', 'none']
    const filter2 = ['==', 'is_pano', !0]
    const filterArray = ['all', filter1, filter2, null, undefined]
    const result = wrapFilterWithAll(filterArray)
    expect(result).toMatchObject(['all', filter1, filter2])
  })

  test('multiple filter get wrapped with all (including null guard)', () => {
    const filter1 = ['==', 'id', 'none']
    const filter2 = ['==', 'is_pano', !0]
    const filterArray = [filter1, filter2, null, undefined]
    const result = wrapFilterWithAll(filterArray)
    expect(result).toMatchObject(['all', filter1, filter2])
  })

  test('one filter get wrapped with all', () => {
    const filter = ['==', 'id', 'none']
    const result = wrapFilterWithAll(filter)
    expect(result).toMatchObject(['all', filter])
  })

  test('mapillary highlighting filter', () => {
    const filter = [[['==', ['get', 'is_pano'], true]], ['==', 'id', 123]]
    const result = wrapFilterWithAll(filter)
    expect(result).toMatchObject(['all', ['==', ['get', 'is_pano'], true], ['==', 'id', 123]])
  })
})

describe('flattenFilter()', () => {
  test('handels undefined', () => {
    const result = _flattenFilter(undefined)
    expect(result).toMatchObject([])
  })
  test('clenaup one "all"', () => {
    const result = _flattenFilter(['all'])
    expect(result).toMatchObject([])
  })
  test('cleanup multiple "all"', () => {
    const filter = ['has', 'foo']
    const result = _flattenFilter(['all', 'all', filter, 'all'])
    expect(result).toMatchObject([filter])
  })
  test('filter expressions passed directly DO NOT WORK and are handeled in wrapFilterWithAll', () => {
    const filter = ['has', 'foo']
    const result = _flattenFilter(filter)
    expect(result).toMatchObject([])
  })
  test('handel 1 level', () => {
    const filter = ['has', 'foo']
    const result = _flattenFilter([filter])
    expect(result).toMatchObject([filter])
  })
  test('handel 1 level', () => {
    const filter = ['has', 'foo']
    const result = _flattenFilter([filter, ['all', filter]])
    expect(result).toMatchObject([filter, filter])
  })
  test('handel multipe levels', () => {
    const filter1 = ['==', 'id', 'none']
    const filter2 = ['==', 'is_pano', !0]
    const result = _flattenFilter([
      filter1,
      ['all', filter2],
      ['all', ['all', ['all'], filter1], filter2],
      filter1,
    ])
    expect(result).toMatchObject([filter1, filter2, filter1, filter2, filter1])
  })
})
