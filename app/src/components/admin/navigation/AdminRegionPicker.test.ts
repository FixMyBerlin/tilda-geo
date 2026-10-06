import { describe, expect, test } from 'vitest'
import type { AdminNavRegion } from '@/server/admin/queries/getAdminNavRegions.server'
import { regionLabel, regionMatchesQuery } from './AdminRegionPicker'

const region = (overrides: Partial<AdminNavRegion> = {}) =>
  ({
    id: 1,
    slug: 'bb',
    name: 'Brandenburg',
    fullName: 'Land Brandenburg',
    status: 'PUBLIC',
    ...overrides,
  }) satisfies AdminNavRegion

describe('regionLabel', () => {
  test('prefers the name and falls back to the slug', () => {
    expect(regionLabel(region())).toBe('Brandenburg')
    expect(regionLabel(region({ name: '' }))).toBe('bb')
  })
})

describe('regionMatchesQuery', () => {
  test('matches name, full name or slug', () => {
    const bb = region()
    expect(regionMatchesQuery(bb, 'brand')).toBe(true)
    expect(regionMatchesQuery(bb, 'land bran')).toBe(true)
    expect(regionMatchesQuery(bb, 'bb')).toBe(true)
    expect(regionMatchesQuery(bb, 'berlin')).toBe(false)
  })
})
