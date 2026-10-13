import { describe, expect, test } from 'vitest'
import { calculateMetricSummaryForAreas, type CalculatorRow } from './calculateMetricSummaries'

type RowInput = { capacity?: number; area?: number } & Record<string, string | number | undefined>

/** A row of area `a1` and the same row of all areas together, like the server returns them. */
const rowsOf = (area: string, inputs: RowInput[], withCombined = true) =>
  inputs.flatMap(({ capacity, area: areaSum, ...properties }) => {
    const row = {
      properties: properties as Record<string, string>,
      sums: {
        ...(capacity === undefined ? {} : { capacity }),
        ...(areaSum === undefined ? {} : { area: areaSum }),
      },
    }
    return [{ area, ...row }, ...(withCombined ? [{ area: 'combined', ...row }] : [])]
  }) satisfies CalculatorRow[]

describe('calculateMetricSummaryForAreas', () => {
  test('a filter does not reorder groups or values', () => {
    const rows = rowsOf('a1', [
      { capacity: 5, surface: 'asphalt', parking: 'lane' },
      { capacity: 3, surface: 'sett', parking: 'lane' },
      { capacity: 4, surface: 'sett', parking: 'street_side' },
    ])
    const order = (filter: Record<string, string[]>) =>
      calculateMetricSummaryForAreas({
        rows,
        areaIds: ['a1'],
        metric: 'capacity',
        groupByKeys: ['surface', 'parking'],
        filter,
      }).combined.groups.map((group) => [group.key, ...group.values.map((v) => v.filterValue)])

    const unfiltered = [
      ['surface', 'sett', 'asphalt'],
      ['parking', 'lane', 'street_side'],
    ]
    expect(order({})).toEqual(unfiltered)
    // With the filter, asphalt (5) is larger than sett (3) and still listed second.
    expect(order({ parking: ['lane'] })).toEqual(unfiltered)
  })

  test('all areas together are the rows of their union, not the sum of the areas', () => {
    const rows = [
      ...rowsOf('a1', [{ capacity: 10 }], false),
      ...rowsOf('a2', [{ capacity: 8 }], false),
      // Both areas share 3 of them.
      ...rowsOf('combined', [{ capacity: 15 }], false),
    ]

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1', 'a2', 'a3'],
      metric: 'capacity',
      groupByKeys: [],
    })

    expect(result.byArea.map(({ key, summary }) => [key, summary.total])).toEqual([
      ['a1', 10],
      ['a2', 8],
      // An area without a row sums nothing.
      ['a3', 0],
    ])
    expect(result.combined.total).toBe(15)
  })

  test('calculates totals and sub sums for configured group keys', () => {
    const rows = rowsOf('a1', [
      { capacity: 20, operator_type: 'public', parking: 'surface' },
      { capacity: 10.5, operator_type: 'private', parking: 'surface' },
      { capacity: 5, operator_type: 'private', parking: 'underground' },
      // Summed by another metric only.
      { area: 12, operator_type: 'public', parking: 'surface' },
    ])

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metric: 'capacity',
      groupByKeys: ['operator_type', 'parking'],
    })

    const operatorTypeGroup = result.combined.groups.find((group) => group.key === 'operator_type')
    expect(operatorTypeGroup?.sum).toBe(35.5)
    expect(operatorTypeGroup?.values).toEqual([
      expect.objectContaining({ value: 'public', sum: 20 }),
      expect.objectContaining({ value: 'private', sum: 15.5 }),
    ])
  })

  test('a filter narrows the total, but a group keeps the other values of its own tag', () => {
    const rows = rowsOf('a1', [
      { capacity: 20, operator_type: 'public', parking: 'lane' },
      { capacity: 10, operator_type: 'private', parking: 'lane' },
      { capacity: 5, operator_type: 'private', parking: '' },
    ])

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metric: 'capacity',
      groupByKeys: ['operator_type', 'parking'],
      filter: { operator_type: ['private'] },
    }).combined

    expect(result.total).toBe(15)
    expect(result.groups.find((group) => group.key === 'operator_type')?.values).toEqual([
      { value: 'public', filterValue: 'public', sum: 20, ratio: 20 / 35 },
      { value: 'private', filterValue: 'private', sum: 15, ratio: 15 / 35 },
    ])
    expect(result.groups.find((group) => group.key === 'parking')?.values).toEqual([
      { value: 'lane', filterValue: 'lane', sum: 10, ratio: 10 / 15 },
      { value: '(Ohne Angabe)', filterValue: '', sum: 5, ratio: 5 / 15 },
    ])
  })

  test('several values of a tag are summed together', () => {
    const rows = rowsOf('a1', [
      { capacity: 20, part: 'bikelanes' },
      { capacity: 10, part: 'roads' },
      { capacity: 5, part: 'paths' },
    ])

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metric: 'capacity',
      groupByKeys: ['part'],
      filter: { part: ['bikelanes', 'paths'] },
    }).combined

    expect(result.total).toBe(25)
    expect(result.groups[0]?.values.map((value) => value.sum)).toEqual([20, 10, 5])
  })

  test('empty and missing values share the fallback label, and a filter on it matches both', () => {
    const rows = rowsOf('a1', [
      { area: 10, surface: '' },
      { area: 5 },
      { area: 3, surface: 'asphalt' },
    ])

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metric: 'area',
      groupByKeys: ['surface'],
      filter: { surface: [''] },
    })

    expect(result.combined.total).toBe(15)
    expect(result.combined.groups[0]?.values).toEqual([
      expect.objectContaining({ value: '(Ohne Angabe)', filterValue: '', sum: 15 }),
      expect.objectContaining({ value: 'asphalt', sum: 3 }),
    ])
  })
})
