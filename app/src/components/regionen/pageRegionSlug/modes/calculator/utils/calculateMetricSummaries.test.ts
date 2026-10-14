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
  const bicycleParkingRows = [
    {
      area: 'combined',
      properties: { kind: 'bicycle_parking' },
      sums: { capacity: 38, objects: 6 },
    },
    {
      area: 'combined',
      properties: { kind: 'bicycle_parking' },
      sums: { objects: 12 },
      missing: { capacity: 12 },
    },
    {
      area: 'combined',
      properties: { kind: 'small_electric_vehicle_parking' },
      sums: { objects: 2 },
      missing: { capacity: 2 },
    },
  ] satisfies CalculatorRow[]

  test('sums every metric in a column, and counts the features without the first in its own', () => {
    const result = calculateMetricSummaryForAreas({
      rows: bicycleParkingRows,
      areaIds: [],
      metrics: ['capacity', 'objects'],
      groupByKeys: ['kind'],
    })

    expect(result.columns).toEqual(['capacity', 'objects', 'missing'])
    expect(result.combined.totals).toEqual({ capacity: 38, objects: 20, missing: 14 })
    expect(result.combined.groups[0]?.values).toEqual([
      expect.objectContaining({
        filterValue: 'bicycle_parking',
        amounts: { capacity: 38, objects: 18, missing: 12 },
      }),
      // No capacity at all: the column has no value, the others count it.
      expect.objectContaining({
        filterValue: 'small_electric_vehicle_parking',
        amounts: { objects: 2, missing: 2 },
        ratios: { objects: 2 / 20, missing: 2 / 14 },
      }),
    ])
  })

  test('a filter narrows every column', () => {
    const { totals } = calculateMetricSummaryForAreas({
      rows: bicycleParkingRows,
      areaIds: [],
      metrics: ['capacity', 'objects'],
      groupByKeys: ['kind'],
      filter: { kind: ['bicycle_parking'] },
    }).combined

    expect(totals).toEqual({ capacity: 38, objects: 18, missing: 12 })
  })

  test('has no missing column when every feature has a value', () => {
    const result = calculateMetricSummaryForAreas({
      rows: rowsOf('a1', [{ capacity: 5, area: 10, parking: 'lane' }]),
      areaIds: ['a1'],
      metrics: ['capacity', 'area'],
      groupByKeys: ['parking'],
    })

    expect(result.columns).toEqual(['capacity', 'area'])
    expect(result.combined.totals).toEqual({ capacity: 5, area: 10 })
  })

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
        metrics: ['capacity'],
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

  test('values without the first metric are ranked by the next column', () => {
    const rows = rowsOf('a1', [
      { capacity: 5, kind: 'bicycle_parking' },
      { area: 30, kind: 'small_electric_vehicle_parking' },
      { area: 10, kind: 'bicycle_rental' },
    ])

    const values = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metrics: ['capacity', 'area'],
      groupByKeys: ['kind'],
    }).combined.groups[0]?.values.map((value) => value.filterValue)

    expect(values).toEqual(['bicycle_parking', 'small_electric_vehicle_parking', 'bicycle_rental'])
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
      metrics: ['capacity'],
      groupByKeys: [],
    })

    expect(result.byArea.map(({ key, summary }) => [key, summary.totals.capacity])).toEqual([
      ['a1', 10],
      ['a2', 8],
      // An area without a row sums nothing.
      ['a3', undefined],
    ])
    expect(result.combined.totals.capacity).toBe(15)
  })

  test('calculates totals and sub sums for configured group keys', () => {
    const rows = rowsOf('a1', [
      { capacity: 20, operator_type: 'public', parking: 'surface' },
      { capacity: 10.5, operator_type: 'private', parking: 'surface' },
      { capacity: 5, operator_type: 'private', parking: 'underground' },
      // Summed by a metric the dataset does not show only.
      { area: 12, operator_type: 'public', parking: 'surface' },
    ])

    const result = calculateMetricSummaryForAreas({
      rows,
      areaIds: ['a1'],
      metrics: ['capacity'],
      groupByKeys: ['operator_type', 'parking'],
    })

    expect(result.combined.totals).toEqual({ capacity: 35.5 })
    const operatorTypeGroup = result.combined.groups.find((group) => group.key === 'operator_type')
    expect(operatorTypeGroup?.values).toEqual([
      expect.objectContaining({ value: 'public', amounts: { capacity: 20 } }),
      expect.objectContaining({ value: 'private', amounts: { capacity: 15.5 } }),
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
      metrics: ['capacity'],
      groupByKeys: ['operator_type', 'parking'],
      filter: { operator_type: ['private'] },
    }).combined

    expect(result.totals.capacity).toBe(15)
    expect(result.groups.find((group) => group.key === 'operator_type')?.values).toEqual([
      {
        value: 'public',
        filterValue: 'public',
        amounts: { capacity: 20 },
        ratios: { capacity: 20 / 35 },
      },
      {
        value: 'private',
        filterValue: 'private',
        amounts: { capacity: 15 },
        ratios: { capacity: 15 / 35 },
      },
    ])
    expect(result.groups.find((group) => group.key === 'parking')?.values).toEqual([
      {
        value: 'lane',
        filterValue: 'lane',
        amounts: { capacity: 10 },
        ratios: { capacity: 10 / 15 },
      },
      {
        value: '(Ohne Angabe)',
        filterValue: '',
        amounts: { capacity: 5 },
        ratios: { capacity: 5 / 15 },
      },
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
      metrics: ['capacity'],
      groupByKeys: ['part'],
      filter: { part: ['bikelanes', 'paths'] },
    }).combined

    expect(result.totals.capacity).toBe(25)
    expect(result.groups[0]?.values.map((value) => value.amounts.capacity)).toEqual([20, 10, 5])
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
      metrics: ['area'],
      groupByKeys: ['surface'],
      filter: { surface: [''] },
    })

    expect(result.combined.totals.area).toBe(15)
    expect(result.combined.groups[0]?.values).toEqual([
      expect.objectContaining({ value: '(Ohne Angabe)', filterValue: '', amounts: { area: 15 } }),
      expect.objectContaining({ value: 'asphalt', amounts: { area: 3 } }),
    ])
  })
})
