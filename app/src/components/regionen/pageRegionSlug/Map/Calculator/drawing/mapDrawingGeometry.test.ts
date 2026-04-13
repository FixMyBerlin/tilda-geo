import { describe, expect, test, vi } from 'vitest'
import type { DrawArea } from './drawAreaTypes'
import { drawAreasToStoreFeatures, snapshotToDrawAreas } from './mapDrawingGeometry'

describe('mapDrawingGeometry', () => {
  test('drawAreasToStoreFeatures preserves ids and geometry', () => {
    const areas: DrawArea[] = [
      {
        type: 'Feature',
        id: 'a1',
        properties: null,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      },
    ]
    const features = drawAreasToStoreFeatures(areas)
    expect(features).toHaveLength(1)
    expect(features[0]?.id).toBe('a1')
    expect(features[0]?.geometry).toEqual(areas[0]?.geometry)
    expect(features[0]?.properties?.mode).toBe('polygon')
    expect(features[0]?.properties?.tildaCalcId).toBe('a1')
  })

  test('snapshotToDrawAreas prefers tildaCalcId', () => {
    const snapshot = drawAreasToStoreFeatures([
      {
        type: 'Feature',
        id: 'x',
        properties: null,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
        },
      },
    ])
    const back = snapshotToDrawAreas(snapshot)
    expect(back[0]?.id).toBe('x')
  })

  test('snapshotToDrawAreas uses random id when missing', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'fixed-test-uuid' })
    const snapshot = [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
              [0, 0],
            ],
          ],
        },
        properties: { mode: 'polygon' },
      },
    ]
    const back = snapshotToDrawAreas(snapshot)
    expect(back[0]?.id).toBe('fixed-test-uuid')
  })
})
