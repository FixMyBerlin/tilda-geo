import { describe, expect, test } from 'vitest'
import type { AccessedRegionType } from '@/server/users/schema'
import { splitAccessedRegionsByRecency } from './splitAccessedRegionsByRecency'

const cutoffAt = new Date('2026-08-11T00:00:00Z').getTime() // 30 days before "now"
const now = new Date('2026-09-10T00:00:00Z')

const region = (slug: string, daysAgo: number): AccessedRegionType => ({
  slug,
  lastAccessedDay: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
})

describe('splitAccessedRegionsByRecency', () => {
  test('splits into recent (>= cutoff) and older (< cutoff)', () => {
    const accessedRegions = [region('recent-a', 1), region('old-a', 40), region('recent-b', 29)]

    const { recent, older } = splitAccessedRegionsByRecency(accessedRegions, cutoffAt)

    expect(recent.map((r) => r.slug)).toEqual(['recent-a', 'recent-b'])
    expect(older.map((r) => r.slug)).toEqual(['old-a'])
  })

  test('sorts both groups most-recently-accessed first', () => {
    const accessedRegions = [region('recent-old', 20), region('recent-new', 2)]

    const { recent } = splitAccessedRegionsByRecency(accessedRegions, cutoffAt)

    expect(recent.map((r) => r.slug)).toEqual(['recent-new', 'recent-old'])
  })

  test('an entry exactly at the cutoff counts as recent', () => {
    const accessedRegions = [region('on-cutoff', 30)]

    const { recent, older } = splitAccessedRegionsByRecency(accessedRegions, cutoffAt)

    expect(recent.map((r) => r.slug)).toEqual(['on-cutoff'])
    expect(older).toEqual([])
  })

  test('accepts a Date as well as an epoch-ms number for cutoffAt', () => {
    const accessedRegions = [region('recent-a', 1), region('old-a', 40)]

    const { recent, older } = splitAccessedRegionsByRecency(accessedRegions, new Date(cutoffAt))

    expect(recent.map((r) => r.slug)).toEqual(['recent-a'])
    expect(older.map((r) => r.slug)).toEqual(['old-a'])
  })

  test('returns empty groups for an empty list', () => {
    expect(splitAccessedRegionsByRecency([], cutoffAt)).toEqual({ recent: [], older: [] })
  })
})
