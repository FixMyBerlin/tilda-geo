import { describe, expect, test } from 'vitest'
import { parseTildaDescription } from './parseTildaDescription'

describe('parseTildaDescription', () => {
  test('reads hint tokens first and the OSM texts last', () => {
    expect(
      parseTildaDescription(
        'TILDA_closed_blocked;TILDA_surface_left=asphalt;OSM-`description`: Zufahrt; nur Anlieger;OSM-`note`: Pflaster; holprig',
      ),
    ).toEqual([
      { kind: 'hint', token: 'TILDA_closed_blocked', value: undefined },
      { kind: 'hint', token: 'TILDA_surface_left', value: 'asphalt' },
      { kind: 'osm', text: 'Zufahrt; nur Anlieger' },
      { kind: 'osm', text: 'Pflaster; holprig' },
    ])
  })

  test('reads a `note` without `description`', () => {
    expect(parseTildaDescription('TILDA_closed_blocked;OSM-`note`: Pflaster')).toEqual([
      { kind: 'hint', token: 'TILDA_closed_blocked', value: undefined },
      { kind: 'osm', text: 'Pflaster' },
    ])
  })

  test('reads hint tokens without OSM texts', () => {
    expect(parseTildaDescription('TILDA_surface_strip=large_sett')).toEqual([
      { kind: 'hint', token: 'TILDA_surface_strip', value: 'large_sett' },
    ])
  })

  test('strips only a leading OSM prefix', () => {
    expect(parseTildaDescription('Siehe OSM-`description`: alt')).toEqual([
      { kind: 'osm', text: 'Siehe OSM-`description`: alt' },
    ])
  })

  test('keeps a description without prefixes as one text', () => {
    expect(parseTildaDescription('Fahrradständer; überdacht')).toEqual([
      { kind: 'osm', text: 'Fahrradständer; überdacht' },
    ])
  })
})
