import { describe, expect, test } from 'vitest'
import {
  regionContractConfigToCreateData,
  regionContractConfigToUpdateData,
} from '@/server/region-contracts/regionContractMapper.server'

const config = {
  slug: 'demo-contract',
  name: 'Demo',
  status: 'ACTIVE' as const,
  regionSlugs: ['alpha', 'beta'],
}

describe('regionContractMapper region relations', () => {
  test('create data uses regions.connect', () => {
    expect(regionContractConfigToCreateData(config)).toEqual({
      slug: 'demo-contract',
      name: 'Demo',
      status: 'ACTIVE',
      regions: { connect: [{ slug: 'alpha' }, { slug: 'beta' }] },
    })
  })

  test('update data uses regions.set (not connect)', () => {
    expect(regionContractConfigToUpdateData(config)).toEqual({
      name: 'Demo',
      status: 'ACTIVE',
      regions: { set: [{ slug: 'alpha' }, { slug: 'beta' }] },
    })
  })

  test('update with empty regionSlugs clears via set: []', () => {
    expect(regionContractConfigToUpdateData({ ...config, regionSlugs: [] })).toEqual({
      name: 'Demo',
      status: 'ACTIVE',
      regions: { set: [] },
    })
  })
})
