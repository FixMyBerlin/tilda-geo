import { describe, expect, test } from 'vitest'
import { jurlStringify } from '../v1/jurlParseStringify'
import migration from './0004_calculator_mode'

const ctx = { categories: [] }
const ring = [
  [13.4, 52.5],
  [13.41, 52.5],
  [13.41, 52.51],
]
const draw = jurlStringify([
  {
    type: 'Feature',
    id: 'e5233090',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
  },
])
const sumOf = (url: string) => JSON.parse(new URL(url).searchParams.get('sum') ?? 'null')

describe('0004 calculator mode', () => {
  test('moves the drawn areas from `draw` to `sum.areas`', () => {
    const result = migration(
      `https://example.com/regionen/foo?v=3&draw=${encodeURIComponent(draw)}`,
      ctx,
    )
    expect(new URL(result).searchParams.has('draw')).toBe(false)
    expect(sumOf(result)).toEqual({
      areas: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
    })
  })

  test("rounds old areas to today's precision", () => {
    const precise = jurlStringify([
      {
        type: 'Feature',
        id: 'a',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [13.4000004, 52.5000049],
              [13.41, 52.5],
              [13.41, 52.51],
              [13.4000004, 52.5000049],
            ],
          ],
        },
      },
    ])
    const result = migration(
      `https://example.com/regionen/foo?v=3&draw=${encodeURIComponent(precise)}`,
      ctx,
    )
    expect(sumOf(result)).toEqual({
      areas: {
        type: 'Polygon',
        coordinates: [
          [
            [13.4, 52.5],
            [13.41, 52.5],
            [13.41, 52.51],
            [13.4, 52.5],
          ],
        ],
      },
    })
  })

  test('drops a `draw` that cannot be read', () => {
    const result = migration('https://example.com/regionen/foo?v=3&draw=nonsense', ctx)
    expect(new URL(result).searchParams.has('draw')).toBe(false)
    expect(sumOf(result)).toBe(null)
  })

  test('leaves links without `draw` alone', () => {
    const url = 'https://example.com/regionen/foo?v=3&map=14/52.5/13.4'
    expect(migration(url, ctx)).toBe(url)
  })
})
