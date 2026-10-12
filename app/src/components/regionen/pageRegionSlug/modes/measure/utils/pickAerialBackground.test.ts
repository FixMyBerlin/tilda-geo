import { describe, expect, test } from 'vitest'
import { pickAerialBackground } from './pickAerialBackground'

const berlin = [13.0736, 52.3332, 13.7645, 52.6826] satisfies [number, number, number, number]
const sources = [
  { id: 'mapnik' },
  { id: 'alkis', category: 'other' as const, bbox: berlin },
  { id: 'mapbox-satellite', category: 'photo' as const, maxzoom: 22 },
  { id: 'maptiler-satellite', category: 'photo' as const, maxzoom: 22 },
  { id: 'berlin-2024', category: 'photo' as const, endDate: '2024', bbox: berlin, maxzoom: 21 },
  { id: 'berlin-2025', category: 'photo' as const, endDate: '2025-04', bbox: berlin, maxzoom: 20 },
  { id: 'berlin-2020', category: 'photo' as const, endDate: '2020', bbox: berlin, best: true },
]
const inBerlin = [13.4, 52.5] satisfies [number, number]
const inHamburg = [10.0, 53.55] satisfies [number, number]
const pick = (allowedIds: string[], center: [number, number]) =>
  pickAerialBackground({ sources, allowedIds, center })?.id

describe('pickAerialBackground', () => {
  test('takes the newest local aerial the region offers', () => {
    expect(pick(['mapnik', 'mapbox-satellite', 'berlin-2024', 'berlin-2025'], inBerlin)).toBe(
      'berlin-2025',
    )
  })

  test('takes the newer of two images of the same year', () => {
    const sameYear = [
      { id: 'spring', category: 'photo' as const, endDate: '2025-04', bbox: berlin },
      { id: 'autumn', category: 'photo' as const, endDate: '2025-09', bbox: berlin },
    ]
    expect(
      pickAerialBackground({
        sources: sameYear,
        allowedIds: ['spring', 'autumn'],
        center: inBerlin,
      })?.id,
    ).toBe('autumn')
  })

  test('prefers the one the index recommends', () => {
    expect(pick(['berlin-2025', 'berlin-2020'], inBerlin)).toBe('berlin-2020')
  })

  test('skips local aerials that do not cover the place', () => {
    expect(pick(['berlin-2025', 'mapbox-satellite'], inHamburg)).toBe('mapbox-satellite')
  })

  test('ignores backgrounds that are no aerial image', () => {
    expect(pick(['mapnik', 'alkis', 'mapbox-satellite'], inBerlin)).toBe('mapbox-satellite')
  })

  test('falls back to a worldwide aerial the region does not list', () => {
    expect(pick(['mapnik'], inBerlin)).toBe('maptiler-satellite')
    expect(pick(['berlin-2025'], inHamburg)).toBe('maptiler-satellite')
  })
})
