import { describe, expect, test } from 'vitest'
import {
  calculatorAreasFromParam,
  calculatorAreasToParam,
  calculatorFilterFromParam,
  calculatorFilterToParam,
  compactCalculatorModeParam,
  zodCalculatorModeParam,
} from './calculatorModeParam'

describe('zodCalculatorModeParam', () => {
  test('a broken field does not drop the others', () => {
    expect(zodCalculatorModeParam.parse({ key: 'parking', filter: 'x' })).toEqual({
      key: 'parking',
    })
    expect(zodCalculatorModeParam.parse({ key: 1, filter: { parking: 'lane' } })).toEqual({
      filter: { parking: 'lane' },
    })
  })
})

describe('compactCalculatorModeParam', () => {
  test('drops what is not set', () => {
    expect(compactCalculatorModeParam({})).toBeUndefined()
    expect(compactCalculatorModeParam({ key: 'a', filter: undefined })).toEqual({ key: 'a' })
  })

  test('keeps an empty filter: it is "no filter" where the dataset has a default filter', () => {
    expect(compactCalculatorModeParam({ filter: {} })).toEqual({ filter: {} })
  })

  test('keeps a filter on a missing value', () => {
    expect(compactCalculatorModeParam({ filter: { surface: '' } })).toEqual({
      filter: { surface: '' },
    })
  })
})

describe('filter', () => {
  test('one value of a tag is a plain string in the URL, several are a list', () => {
    const filter = { operator_type: ['public'], part: ['bikelanes', 'roads'] }
    const param = { operator_type: 'public', part: ['bikelanes', 'roads'] }
    expect(calculatorFilterToParam(filter)).toEqual(param)
    expect(calculatorFilterFromParam(param)).toEqual(filter)
  })

  test('drops a tag without values and repeated values', () => {
    expect(calculatorFilterFromParam({ part: [], surface: ['a', 'a'] })).toEqual({
      surface: ['a'],
    })
  })
})

describe('areas', () => {
  const square = [
    [
      [13.4, 52.5],
      [13.41, 52.5],
      [13.41, 52.51],
      [13.4, 52.5],
    ],
  ] satisfies [number, number][][]

  test('one area is a Polygon, several are a MultiPolygon; ids follow the position', () => {
    const one = calculatorAreasFromParam({ type: 'Polygon', coordinates: square })
    expect(one.map((area) => area.id)).toEqual(['part-0'])
    expect(calculatorAreasToParam(one)).toEqual({ type: 'Polygon', coordinates: square })

    const two = calculatorAreasFromParam({ type: 'MultiPolygon', coordinates: [square, square] })
    expect(two.map((area) => area.id)).toEqual(['part-0', 'part-1'])
    expect(calculatorAreasToParam(two)).toEqual({
      type: 'MultiPolygon',
      coordinates: [square, square],
    })
    expect(calculatorAreasToParam([])).toBeUndefined()
  })

  test('a broken geometry drops the areas, not the dataset', () => {
    expect(
      zodCalculatorModeParam.parse({ key: 'a', areas: { type: 'Polygon', coordinates: [[]] } }),
    ).toEqual({ key: 'a' })
  })
})
