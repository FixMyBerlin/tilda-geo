import { describe, expect, test } from 'vitest'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { modeSwitcherSearch } from './modeSwitcherSearch'

const area = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [13.4000004, 52.5000004] as [number, number],
      [13.401, 52.5] as [number, number],
      [13.401, 52.501] as [number, number],
      [13.4000004, 52.5000004] as [number, number],
    ],
  ],
}
const line = {
  type: 'LineString' as const,
  coordinates: [[13.4, 52.5] as [number, number], [13.401, 52.5] as [number, number]],
}

describe('modeSwitcherSearch', () => {
  test('returns the previous search unchanged; mode-scoped keys are stripped by route middleware', () => {
    const prev = {
      map: '14/52.5/13.4',
      [searchParamsRegistry.notes]: { new: '14/52.5/13.4' },
    }
    expect(modeSwitcherSearch('notes', prev)).toBe(prev)
    expect(modeSwitcherSearch('map', prev)).toBe(prev)
    expect(modeSwitcherSearch('qa', prev)).toBe(prev)
    expect(modeSwitcherSearch('reviewLists', prev)).toBe(prev)
    expect(modeSwitcherSearch('measure', prev)).toBe(prev)
    expect(modeSwitcherSearch('calculator', prev)).toBe(prev)
  })

  test('takes the areas of Summieren over to Messen when Messen has none', () => {
    const prev = { sum: { key: 'parking', areas: area }, measure: { lines: line } }
    expect(modeSwitcherSearch('measure', prev)).toEqual({
      sum: prev.sum,
      measure: { lines: line, areas: area },
    })
  })

  test('takes the areas of Messen over to Summieren on its coarser grid, without the lines', () => {
    const prev = { measure: { lines: line, areas: area } }
    const next: { measure?: unknown; sum?: { areas?: typeof area; lines?: unknown } } =
      modeSwitcherSearch('calculator', prev)
    expect(next.measure).toBe(prev.measure)
    expect(next.sum?.areas?.coordinates[0]?.[0]).toEqual([13.4, 52.5])
    expect(next.sum?.lines).toBeUndefined()
  })

  test('leaves a mode alone that has areas of its own', () => {
    const own = { ...area, coordinates: [[...(area.coordinates[0] ?? [])].reverse()] }
    const prev = { sum: { areas: area }, measure: { areas: own } }
    expect(modeSwitcherSearch('measure', prev)).toBe(prev)
    expect(modeSwitcherSearch('calculator', prev)).toBe(prev)
  })

  test('does not copy when another mode is opened', () => {
    const prev = { sum: { areas: area } }
    expect(modeSwitcherSearch('map', prev)).toBe(prev)
    expect(modeSwitcherSearch('notes', prev)).toBe(prev)
  })
})
