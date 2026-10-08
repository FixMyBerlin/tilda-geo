import { describe, expect, test } from 'vitest'
import {
  calculatorAreasFromParam,
  calculatorAreasToParam,
  compactCalculatorModeParam,
  zodCalculatorModeParam,
} from './calculatorModeParam'

describe('zodCalculatorModeParam', () => {
  test('a broken field does not drop the others', () => {
    expect(zodCalculatorModeParam.parse({ key: 'tilda_parkings_quantized', filter: 'x' })).toEqual({
      key: 'tilda_parkings_quantized',
    })
    expect(zodCalculatorModeParam.parse({ key: 1, filter: { parking: 'lane' } })).toEqual({
      filter: { parking: 'lane' },
    })
  })
})

describe('compactCalculatorModeParam', () => {
  test('drops defaults and empty filters', () => {
    expect(compactCalculatorModeParam({})).toBeUndefined()
    expect(compactCalculatorModeParam({ filter: {} })).toBeUndefined()
    expect(compactCalculatorModeParam({ key: 'a', filter: {} })).toEqual({ key: 'a' })
  })

  test('keeps a filter on a missing value', () => {
    expect(compactCalculatorModeParam({ filter: { surface: '' } })).toEqual({
      filter: { surface: '' },
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
