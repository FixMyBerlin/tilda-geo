import { describe, expect, test } from 'vitest'
import { formatArea, formatLength, measureGeometry, measureSegments } from './measureMath'

// About 100 m east-west and 100 m north-south at the latitude of Berlin.
const lng100m = 0.001474
const lat100m = 0.000899
const square = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4, 52.5],
      [13.4 + lng100m, 52.5],
      [13.4 + lng100m, 52.5 + lat100m],
      [13.4, 52.5 + lat100m],
      [13.4, 52.5],
    ],
  ],
} satisfies GeoJSON.Polygon

describe('measureGeometry', () => {
  test('length of a line in metres', () => {
    const result = measureGeometry({
      type: 'LineString',
      coordinates: [
        [13.4, 52.5],
        [13.4 + lng100m, 52.5],
      ],
    })
    expect(result.kind).toBe('line')
    expect(result.kind === 'line' && result.lengthM).toBeCloseTo(100, 0)
  })

  test('area and perimeter of a polygon', () => {
    const result = measureGeometry(square)
    if (result.kind !== 'area') throw new Error('expected an area')
    expect(result.areaM2 / 10_000).toBeCloseTo(1, 1)
    expect(result.perimeterM / 400).toBeCloseTo(1, 2)
  })
})

describe('measureSegments', () => {
  test('one entry per side, with the middle of the side', () => {
    const segments = measureSegments(square)
    expect(segments).toHaveLength(4)
    expect(segments[0]?.middle[0]).toBeCloseTo(13.4 + lng100m / 2, 6)
    expect(segments[0]?.lengthM).toBeCloseTo(100, 0)
  })
})

describe('formatting', () => {
  test('lengths', () => {
    expect(formatLength(3.456)).toBe('3,46 m')
    expect(formatLength(12.44)).toBe('12,4 m')
    expect(formatLength(123.4)).toBe('123 m')
    expect(formatLength(1234)).toBe('1,23 km')
  })

  test('areas', () => {
    expect(formatArea(35.21)).toBe('35,2 m²')
    expect(formatArea(1234.4)).toBe('1.234 m²')
    expect(formatArea(12_340)).toBe('1,23 ha')
    expect(formatArea(1_234_000)).toBe('1,23 km²')
  })
})
