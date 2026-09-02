import { describe, expect, test } from 'vitest'
import { buildRegionContractFilterItems } from '@/components/admin/regions/pageRegions/buildRegionContractFilterItems'
import { RegionContractStatus } from '@/prisma/generated/browser'
import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import {
  filterRegionsByContractSearch,
  SINGLETON_CONTRACT_PARAM,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'

const mockContract = (slug: string, regionCount: number, id = slug.length): TRegionContract => ({
  id,
  slug,
  name: slug,
  status: RegionContractStatus.ACTIVE,
  regionCount,
})

const mockRegion = (slug: string, contract: TRegionContract | null = null): TRegion =>
  ({
    id: 1,
    slug,
    name: slug,
    fullName: slug,
    promoted: false,
    status: 'PRIVATE',
    product: 'radverkehr',
    notes: 'disabled',
    spaceFinderEnabled: true,
    map: { lat: 0, lng: 0, zoom: 10 },
    mask: null,
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: ['roads'],
    backgroundSources: [],
    exports: null,
    bbox: null,
    contract,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as TRegion

const brandenburg = mockContract('brandenburg', 2, 1)

describe('buildRegionContractFilterItems', () => {
  test('includes Alle, Brandenburg, and unassigned bucket counts', () => {
    const regions = [
      mockRegion('bb-sg', brandenburg),
      mockRegion('bb-pg', brandenburg),
      mockRegion('berlin'),
      mockRegion('bibi'),
    ]
    const items = buildRegionContractFilterItems(regions)
    expect(items.find((i) => i.id === '')?.count).toBe(4)
    expect(items.find((i) => i.id === 'brandenburg')?.count).toBe(2)
    expect(items.find((i) => i.id === SINGLETON_CONTRACT_PARAM)?.count).toBe(2)
  })
})

describe('filterRegionsByContractSearch', () => {
  test('filters by contract slug and unassigned bucket', () => {
    const regions = [
      mockRegion('bb-sg', brandenburg),
      mockRegion('bb-pg', brandenburg),
      mockRegion('berlin'),
      mockRegion('bibi'),
    ]
    expect(filterRegionsByContractSearch(regions, 'brandenburg').map((r) => r.slug)).toEqual([
      'bb-sg',
      'bb-pg',
    ])
    expect(
      filterRegionsByContractSearch(regions, SINGLETON_CONTRACT_PARAM).map((r) => r.slug),
    ).toEqual(['berlin', 'bibi'])
    expect(filterRegionsByContractSearch(regions, '').length).toBe(4)
  })
})
