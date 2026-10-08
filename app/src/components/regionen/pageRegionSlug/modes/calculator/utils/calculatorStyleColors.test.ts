import { describe, expect, test } from 'vitest'
import {
  buildCalculatorStyleColors,
  calculatorStyleColorExpression,
  calculatorStyleOtherColor,
} from './calculatorStyleColors'

describe('calculator style colors', () => {
  test('values get palette colors in order; more values than colors share the other color', () => {
    const values = Array.from({ length: 10 }, (_, index) => `v${index}`)
    const { colors } = buildCalculatorStyleColors('parking', values)
    expect(new Set(Object.values(colors).slice(0, 8)).size).toBe(8)
    expect(colors.v8).toBe(calculatorStyleOtherColor)
    expect(colors.v9).toBe(calculatorStyleOtherColor)
  })

  test('the map expression matches the tag value, a missing tag as empty string', () => {
    const style = buildCalculatorStyleColors('parking', ['lane', ''])
    expect(calculatorStyleColorExpression(style)).toEqual([
      'match',
      ['to-string', ['coalesce', ['get', 'parking'], '']],
      'lane',
      style.colors.lane,
      '',
      style.colors[''],
      calculatorStyleOtherColor,
    ])
  })

  test('no expression without values', () => {
    expect(
      calculatorStyleColorExpression(buildCalculatorStyleColors('parking', [])),
    ).toBeUndefined()
  })
})
