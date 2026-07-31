import { describe, expect, test } from 'vitest'
import {
  filterPartitionedRegions,
  filterRegions,
  mergeRegionenIndexRegions,
  partitionRegionsByStatus,
} from './regionenIndexMergeUtils'

type RegionenIndexData = NonNullable<Parameters<typeof mergeRegionenIndexRegions>[0]>
type RegionenIndexRegion = RegionenIndexData['publicRegions'][number]

const region = (slug: string, overrides: Partial<RegionenIndexRegion> = {}) =>
  ({
    slug,
    name: slug.toUpperCase(),
    fullName: `Full ${slug}`,
    status: 'PUBLIC',
    promoted: true,
    ...overrides,
  }) as RegionenIndexRegion

describe('mergeRegionenIndexRegions', () => {
  test('returns empty array when data is undefined', () => {
    expect(mergeRegionenIndexRegions(undefined)).toEqual([])
  })

  test('dedupes regions by slug across buckets', () => {
    const berlin = region('berlin')
    const merged = mergeRegionenIndexRegions({
      activeRegions: [berlin],
      deactivatedRegions: [berlin],
      publicRegions: [berlin],
      nonPublicRegions: [berlin],
    })

    expect(merged).toHaveLength(1)
    expect(merged[0]?.slug).toBe('berlin')
  })

  test('sorts merged regions by German name', () => {
    const merged = mergeRegionenIndexRegions({
      activeRegions: [],
      deactivatedRegions: [],
      publicRegions: [region('z-zz', { name: 'Zzz' }), region('a-aa', { name: 'Aaa' })],
      nonPublicRegions: [],
    })

    expect(merged.map((item) => item.slug)).toEqual(['a-aa', 'z-zz'])
  })
})

describe('partitionRegionsByStatus', () => {
  test('splits active and deactivated regions', () => {
    const activeRegion = region('active')
    const deactivatedRegion = region('old', { status: 'DEACTIVATED' })
    const { active, deactivated } = partitionRegionsByStatus([activeRegion, deactivatedRegion])

    expect(active).toEqual([activeRegion])
    expect(deactivated).toEqual([deactivatedRegion])
  })
})

describe('filterRegions', () => {
  test('matches name, fullName, and slug case-insensitively', () => {
    const regions = [
      region('berlin', { name: 'Ber', fullName: 'Berlin Ring' }),
      region('hamburg', { name: 'Ham', fullName: 'Hamburg City' }),
    ]

    expect(filterRegions(regions, 'ber')).toEqual([regions[0]])
    expect(filterRegions(regions, 'ring')).toEqual([regions[0]])
    expect(filterRegions(regions, 'HAMBURG')).toEqual([regions[1]])
    expect(filterRegions(regions, '')).toEqual(regions)
  })
})

describe('filterPartitionedRegions', () => {
  test('filters each partition independently', () => {
    const active = region('berlin', { name: 'Ber' })
    const deactivated = region('old', { name: 'Old', status: 'DEACTIVATED' })
    const filtered = filterPartitionedRegions(
      { active: [active], deactivated: [deactivated] },
      'old',
    )

    expect(filtered.active).toEqual([])
    expect(filtered.deactivated).toEqual([deactivated])
  })
})
