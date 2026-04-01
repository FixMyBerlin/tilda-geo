import { describe, expect, test } from 'vitest'
import { expandObjectKeys } from './expandObjectKeys'

describe('expandObjectKeys()', () => {
  describe('transform cases', () => {
    const expanded = {
      id: 'foo1',
      active: true,
      styles: [
        { id: 's1', active: false },
        { id: 's2', active: true },
      ],
      default: false,
      options: { id: 'o2', default: true },
      type: 'Feature',
      properties: [],
      geometry: {
        coordinates: [
          [1, 2],
          [1, 2],
        ],
      },
    }
    const minimized = {
      i: 'foo1',
      a: true,
      s: [
        { i: 's1', a: false },
        { i: 's2', a: true },
      ],
      d: false,
      o: { i: 'o2', d: true },
      t: 'Feature',
      p: [],
      g: {
        c: [
          [1, 2],
          [1, 2],
        ],
      },
    }

    test('expand all keys in nested object', () => {
      const result = expandObjectKeys(minimized)
      expect(result).toMatchObject(expanded)
    })
  })
})
