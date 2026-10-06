import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import {
  calculateMetricSummaryForAreas,
  getAvailableMetricsForAreas,
} from './calculateMetricSummaries'

let testFeatureId = 0
const createFeature = (properties: Record<string, unknown>) =>
  ({
    type: 'Feature',
    id: `test-feature-${++testFeatureId}`,
    properties,
    geometry: {
      type: 'Point',
      coordinates: [13.4, 52.5],
    },
  }) as MapGeoJSONFeature

describe('getAvailableMetricsForAreas', () => {
  test('returns only metrics with at least one numeric value', () => {
    const areas = [
      {
        key: 'a1',
        features: [
          createFeature({ capacity: 10, operator_type: 'public' }),
          createFeature({ area: '12.5', operator_type: 'private' }),
          createFeature({ capacity: 'NaN' }),
        ],
      },
    ]

    const result = getAvailableMetricsForAreas(areas, ['capacity', 'area', 'length'])

    expect(result).toEqual(['capacity', 'area'])
  })
})

describe('calculateMetricSummaryForAreas', () => {
  test('calculates totals and sub sums for configured group keys', () => {
    const areas = [
      {
        key: 'a1',
        features: [
          createFeature({ capacity: 20, operator_type: 'public', parking: 'surface' }),
          createFeature({ capacity: 10, operator_type: 'private', parking: 'surface' }),
          createFeature({ capacity: 5, operator_type: 'private', parking: 'underground' }),
          createFeature({ capacity: null, operator_type: 'public', parking: 'surface' }),
        ],
      },
      {
        key: 'a2',
        features: [createFeature({ capacity: 15, operator_type: 'public', parking: 'surface' })],
      },
    ]

    const result = calculateMetricSummaryForAreas({
      areas,
      metric: 'capacity',
      groupByKeys: ['operator_type', 'parking'],
    })

    expect(result.byArea[0]?.summary.total).toBe(35)
    expect(result.byArea[1]?.summary.total).toBe(15)
    expect(result.combined.total).toBe(50)

    const operatorTypeGroup = result.combined.groups.find((group) => group.key === 'operator_type')
    expect(operatorTypeGroup?.sum).toBe(50)
    expect(operatorTypeGroup?.values).toEqual([
      expect.objectContaining({ value: 'public', sum: 35 }),
      expect.objectContaining({ value: 'private', sum: 15 }),
    ])
  })

  test('groups empty values under fallback label', () => {
    const areas = [
      {
        key: 'a1',
        features: [createFeature({ area: 10, operator_type: '' }), createFeature({ area: 5 })],
      },
    ]

    const result = calculateMetricSummaryForAreas({
      areas,
      metric: 'area',
      groupByKeys: ['operator_type'],
    })

    expect(result.combined.groups[0]?.values).toEqual([
      expect.objectContaining({ value: '(Ohne Angabe)', filterValue: '', sum: 15 }),
    ])
  })

  test('a filter narrows the total, but a group keeps the other values of its own tag', () => {
    const areas = [
      {
        key: 'a1',
        features: [
          createFeature({ capacity: 20, operator_type: 'public', parking: 'lane' }),
          createFeature({ capacity: 10, operator_type: 'private', parking: 'lane' }),
          createFeature({ capacity: 5, operator_type: 'private' }),
        ],
      },
    ]

    const result = calculateMetricSummaryForAreas({
      areas,
      metric: 'capacity',
      groupByKeys: ['operator_type', 'parking'],
      filter: { operator_type: 'private' },
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

  test('a filter on a missing value matches missing and blank tags', () => {
    const areas = [
      {
        key: 'a1',
        features: [
          createFeature({ area: 10, surface: ' ' }),
          createFeature({ area: 5 }),
          createFeature({ area: 3, surface: 'asphalt' }),
        ],
      },
    ]

    const result = calculateMetricSummaryForAreas({
      areas,
      metric: 'area',
      groupByKeys: ['surface'],
      filter: { surface: '' },
    })

    expect(result.combined.total).toBe(15)
  })
})
