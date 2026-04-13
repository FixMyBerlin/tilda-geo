import { describe, expect, test } from 'vitest'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { jurlStringify } from './useCategoriesConfig/v1/jurlParseStringify'

describe('calculator draw URL payload', () => {
  test('jurlStringify roundtrip for draw areas matches parser expectations', async () => {
    const { jsurlParse } = await import('./useCategoriesConfig/v1/jurlParseStringify')
    const areas: DrawArea[] = [
      {
        type: 'Feature',
        id: 'id-1',
        properties: null,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [13.4, 52.5],
              [13.41, 52.5],
              [13.41, 52.51],
              [13.4, 52.51],
              [13.4, 52.5],
            ],
          ],
        },
      },
    ]
    const encoded = jurlStringify(areas)
    const parsed = jsurlParse(encoded)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toEqual(areas)
  })
})
