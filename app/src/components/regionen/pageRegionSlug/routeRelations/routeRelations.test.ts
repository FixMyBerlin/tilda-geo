import { describe, expect, test } from 'vitest'
import {
  parseRouteRelations,
  type RouteRelationHighlight,
  routeRelationFilter,
} from './routeRelations'

describe('parseRouteRelations', () => {
  test('splits OSM routes and pseudo relations', () => {
    expect(
      parseRouteRelations('bicycle:2788485,12138805;bus:1234567;radnetz_berlin:Ergänzungsnetz'),
    ).toEqual({
      routes: [
        { route: 'bicycle', relationIds: [2788485, 12138805] },
        { route: 'bus', relationIds: [1234567] },
      ],
      pseudo: [{ group: 'radnetz_berlin', value: 'Ergänzungsnetz' }],
    })
  })

  test('returns empty lists without a value', () => {
    expect(parseRouteRelations(undefined)).toEqual({ routes: [], pseudo: [] })
  })
})

describe('routeRelationFilter', () => {
  // The `in` needles the filter checks, applied like MapLibre does on `";" + value + ";"`.
  const matches = (value: string, highlight: RouteRelationHighlight) => {
    const [, ...checks] = routeRelationFilter(highlight)
    return checks.some((check) => `;${value};`.includes(check[1] as string))
  }

  test('finds an id at the start, in the middle and at the end', () => {
    const value = 'bicycle:11,22,33;bus:44'
    expect(matches(value, { relationId: 11 })).toBe(true)
    expect(matches(value, { relationId: 22 })).toBe(true)
    expect(matches(value, { relationId: 33 })).toBe(true)
    expect(matches(value, { relationId: 44 })).toBe(true)
  })

  test('does not match an id that is only part of another id', () => {
    const value = 'bicycle:2788485;bus:1234567'
    expect(matches(value, { relationId: 278848 })).toBe(false)
    expect(matches(value, { relationId: 788485 })).toBe(false)
    expect(matches(value, { relationId: 123456 })).toBe(false)
  })

  test('finds a pseudo class only in its own group', () => {
    const vorrang = { group: 'radnetz_berlin', value: 'Vorrangnetz' } as const
    expect(matches('radnetz_berlin:Vorrangnetz', vorrang)).toBe(true)
    expect(matches('bicycle:2788485;radnetz_berlin:Vorrangnetz', vorrang)).toBe(true)
    expect(matches('bicycle:2788485;radnetz_berlin:Ergänzungsnetz', vorrang)).toBe(false)
    expect(matches('bicycle:2788485', vorrang)).toBe(false)
  })
})
