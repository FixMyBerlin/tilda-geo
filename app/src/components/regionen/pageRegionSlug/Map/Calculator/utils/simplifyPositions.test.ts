import { describe, expect, test } from 'vitest'
import type { DrawArea } from '../drawing/drawAreaTypes'
import { simplifyPositions } from './simplifyPositions'

describe('simplify()', () => {
  test('Works with Polygon', () => {
    const input = {
      id: 'd249ecdeb8f9d69892da474098481c7f',
      type: 'Feature',
      properties: {},
      geometry: {
        coordinates: [
          [
            [13.375317989228733, 52.51743078752105],
            [13.353853857201216, 52.516293590194834],
            [13.351771516035086, 52.510639658026065],
            [13.375798529498496, 52.51255687745913],
            [13.375317989228733, 52.51743078752105],
          ],
        ],
        type: 'Polygon',
      },
    } as DrawArea
    const output = {
      id: 'd249ecdeb8f9d69892da474098481c7f',
      type: 'Feature',
      properties: {},
      geometry: {
        coordinates: [
          [
            [13.37532, 52.51743],
            [13.35385, 52.51629],
            [13.35177, 52.51064],
            [13.3758, 52.51256],
            [13.37532, 52.51743],
          ],
        ],
        type: 'Polygon',
      },
    } as DrawArea
    const result = simplifyPositions([input])
    expect(result).toMatchObject([output])
  })

  test('Works with Polygon and negative values', () => {
    const input = {
      id: 'd249ecdeb8f9d69892da474098481c7f',
      type: 'Feature',
      properties: {},
      geometry: {
        coordinates: [
          [
            [184.02463975738777, 1.2359748274097626],
            [152.92998626473684, 1.2359748274097626],
            [152.92998626473684, -8.72494084269951],
            [184.02463975738777, -8.72494084269951],
            [184.02463975738777, 1.2359748274097626],
          ],
        ],
        type: 'Polygon',
      },
    } as DrawArea
    const output = {
      id: 'd249ecdeb8f9d69892da474098481c7f',
      type: 'Feature',
      properties: {},
      geometry: {
        coordinates: [
          [
            [184.02464, 1.23597],
            [152.92999, 1.23597],
            [152.92999, -8.72494],
            [184.02464, -8.72494],
            [184.02464, 1.23597],
          ],
        ],
        type: 'Polygon',
      },
    } as DrawArea
    const result = simplifyPositions([input])
    expect(result).toMatchObject([output])
  })
})
