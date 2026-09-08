import { describe, expect, test } from 'vitest'
import {
  combinePartsIntoGeometry,
  reviewEditGeometryChanged,
  splitGeometryIntoParts,
} from './reviewGeometryParts'

const point = (coordinates: GeoJSON.Position) =>
  ({ type: 'Point', coordinates }) satisfies GeoJSON.Point

const lineString = (coordinates: GeoJSON.Position[]) =>
  ({ type: 'LineString', coordinates }) satisfies GeoJSON.LineString

const polygon = (coordinates: GeoJSON.Position[][]) =>
  ({ type: 'Polygon', coordinates }) satisfies GeoJSON.Polygon

const POINT_A = point([13.4, 52.5])
const POINT_B = point([13.5, 52.6])
const LINE_A = lineString([
  [13.4, 52.5],
  [13.5, 52.6],
])
const LINE_B = lineString([
  [13.6, 52.7],
  [13.7, 52.8],
])
const POLYGON_A = polygon([
  [
    [13.4, 52.5],
    [13.5, 52.5],
    [13.5, 52.6],
    [13.4, 52.5],
  ],
])
const POLYGON_B = polygon([
  [
    [13.6, 52.7],
    [13.7, 52.7],
    [13.7, 52.8],
    [13.6, 52.7],
  ],
])

const MULTI_POINT = {
  type: 'MultiPoint',
  coordinates: [POINT_A.coordinates, POINT_B.coordinates],
} satisfies GeoJSON.MultiPoint

const MULTI_LINE = {
  type: 'MultiLineString',
  coordinates: [LINE_A.coordinates, LINE_B.coordinates],
} satisfies GeoJSON.MultiLineString

const MULTI_POLYGON = {
  type: 'MultiPolygon',
  coordinates: [POLYGON_A.coordinates, POLYGON_B.coordinates],
} satisfies GeoJSON.MultiPolygon

describe('splitGeometryIntoParts', () => {
  test('splits all six supported types into the matching family', () => {
    expect(splitGeometryIntoParts(POINT_A)).toEqual({ family: 'point', parts: [POINT_A] })
    expect(splitGeometryIntoParts(MULTI_POINT)).toEqual({
      family: 'point',
      parts: [POINT_A, POINT_B],
    })
    expect(splitGeometryIntoParts(LINE_A)).toEqual({ family: 'linestring', parts: [LINE_A] })
    expect(splitGeometryIntoParts(MULTI_LINE)).toEqual({
      family: 'linestring',
      parts: [LINE_A, LINE_B],
    })
    expect(splitGeometryIntoParts(POLYGON_A)).toEqual({ family: 'polygon', parts: [POLYGON_A] })
    expect(splitGeometryIntoParts(MULTI_POLYGON)).toEqual({
      family: 'polygon',
      parts: [POLYGON_A, POLYGON_B],
    })
  })

  test('returns null for GeometryCollection', () => {
    expect(splitGeometryIntoParts({ type: 'GeometryCollection', geometries: [POINT_A] })).toBeNull()
  })
})

describe('combinePartsIntoGeometry', () => {
  test('returns null for zero parts', () => {
    expect(combinePartsIntoGeometry('point', [])).toBeNull()
    expect(combinePartsIntoGeometry('linestring', [])).toBeNull()
    expect(combinePartsIntoGeometry('polygon', [])).toBeNull()
  })

  test('keeps a single part as Point / LineString / Polygon', () => {
    expect(combinePartsIntoGeometry('point', [POINT_A])).toEqual(POINT_A)
    expect(combinePartsIntoGeometry('linestring', [LINE_A])).toEqual(LINE_A)
    expect(combinePartsIntoGeometry('polygon', [POLYGON_A])).toEqual(POLYGON_A)
  })

  test('promotes N parts to MultiPoint / MultiLineString / MultiPolygon', () => {
    expect(combinePartsIntoGeometry('point', [POINT_A, POINT_B])).toEqual(MULTI_POINT)
    expect(combinePartsIntoGeometry('linestring', [LINE_A, LINE_B])).toEqual(MULTI_LINE)
    expect(combinePartsIntoGeometry('polygon', [POLYGON_A, POLYGON_B])).toEqual(MULTI_POLYGON)
  })

  test('ignores parts from another family', () => {
    expect(combinePartsIntoGeometry('point', [POINT_A, LINE_A])).toEqual(POINT_A)
    expect(combinePartsIntoGeometry('point', [LINE_A])).toBeNull()
  })
})

describe('split + combine round-trip', () => {
  test('is stable for single-part and multi-part inputs', () => {
    const cases = [POINT_A, LINE_A, POLYGON_A, MULTI_POINT, MULTI_LINE, MULTI_POLYGON] as const
    for (const geometry of cases) {
      const split = splitGeometryIntoParts(geometry)
      expect(split).not.toBeNull()
      if (!split) continue
      expect(combinePartsIntoGeometry(split.family, split.parts)).toEqual(geometry)
    }
  })

  test('a one-part Multi* becomes the non-Multi type', () => {
    const onePoint = {
      type: 'MultiPoint',
      coordinates: [POINT_A.coordinates],
    } satisfies GeoJSON.MultiPoint
    const split = splitGeometryIntoParts(onePoint)
    expect(split).toEqual({ family: 'point', parts: [POINT_A] })
    expect(combinePartsIntoGeometry(split!.family, split!.parts)).toEqual(POINT_A)
  })
})

describe('reviewEditGeometryChanged', () => {
  test('skips persist when current is missing or equals the loaded baseline', () => {
    expect(reviewEditGeometryChanged(POINT_A, null)).toBe(false)
    expect(reviewEditGeometryChanged(POINT_A, POINT_A)).toBe(false)
    expect(reviewEditGeometryChanged(MULTI_POINT, structuredClone(MULTI_POINT))).toBe(false)
  })

  test('persists when there is no baseline or the geometry actually changed', () => {
    expect(reviewEditGeometryChanged(null, POINT_A)).toBe(true)
    expect(reviewEditGeometryChanged(POINT_A, POINT_B)).toBe(true)
    expect(reviewEditGeometryChanged(POINT_A, MULTI_POINT)).toBe(true)
  })
})
