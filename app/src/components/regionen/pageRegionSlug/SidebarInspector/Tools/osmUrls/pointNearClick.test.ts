import { describe, expect, test } from 'vitest'
import { pointNearClick } from './pointNearClick'

const line: GeoJSON.LineString = {
  type: 'LineString',
  coordinates: [
    [13.4, 52.5],
    [13.41, 52.5],
  ],
}

describe('pointNearClick()', () => {
  test('moves a click next to a line onto the line', () => {
    const [lng, lat] = pointNearClick(line, [13.408, 52.5001])
    expect(lng).toBeCloseTo(13.408, 4)
    expect(lat).toBeCloseTo(52.5, 4)
  })

  test('takes the middle of the line without a click', () => {
    const [lng] = pointNearClick(line, null)
    expect(lng).toBeCloseTo(13.405, 4)
  })

  test('keeps the click inside an area and the position of a point', () => {
    const area: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [13.4, 52.5],
          [13.41, 52.5],
          [13.41, 52.51],
          [13.4, 52.5],
        ],
      ],
    }
    expect(pointNearClick(area, [13.409, 52.501])).toEqual([13.409, 52.501])
    expect(pointNearClick({ type: 'Point', coordinates: [13.4, 52.5] }, [13.41, 52.51])).toEqual([
      13.4, 52.5,
    ])
  })
})
