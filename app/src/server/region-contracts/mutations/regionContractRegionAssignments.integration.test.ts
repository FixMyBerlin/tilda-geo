import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { isIntegrationDbAvailable } from '../../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/server/auth/session.server', () => ({
  requireAdmin,
}))

import db from '@/server/db.server'
import { createRegionContractWithData } from '@/server/region-contracts/mutations/createRegionContract.server'
import { updateRegionContractWithData } from '@/server/region-contracts/mutations/updateRegionContract.server'

const CONTRACT_SLUG = 'vitest-contract-regions'
const REGION_SLUGS = ['vitest-contract-r1', 'vitest-contract-r2', 'vitest-contract-r3'] as const
const ADMIN_USER_ID = 'vitest-contract-regions-admin'

describe.skipIf(!integrationDb)('region contract region assignments (integration)', () => {
  beforeAll(async () => {
    requireAdmin.mockResolvedValue({ userId: ADMIN_USER_ID })

    await db.region.deleteMany({ where: { slug: { in: [...REGION_SLUGS] } } })
    await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })

    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-contract-regions@users.openstreetmap.invalid',
        osmId: 1_900_000_005,
        osmName: 'vitest-contract-regions',
        role: 'ADMIN',
      },
    })

    for (const slug of REGION_SLUGS) {
      await db.region.create({
        data: {
          slug,
          name: slug,
          fullName: slug,
          categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
        },
      })
    }
  })

  afterAll(async () => {
    await db.region.deleteMany({ where: { slug: { in: [...REGION_SLUGS] } } })
    await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
  })

  test('create assigns regions via connect', async () => {
    const headers = new Headers()
    const result = await createRegionContractWithData(
      {
        slug: CONTRACT_SLUG,
        name: 'Vitest contract regions',
        status: 'ACTIVE',
        regionSlugs: [REGION_SLUGS[0], REGION_SLUGS[1]],
      },
      headers,
    )

    expect(result.success).toBe(true)

    const regions = await db.region.findMany({
      where: { slug: { in: [...REGION_SLUGS] } },
      select: { slug: true, contractId: true },
      orderBy: { slug: 'asc' },
    })
    const contract = await db.regionContract.findUniqueOrThrow({ where: { slug: CONTRACT_SLUG } })
    expect(regions).toEqual([
      { slug: REGION_SLUGS[0], contractId: contract.id },
      { slug: REGION_SLUGS[1], contractId: contract.id },
      { slug: REGION_SLUGS[2], contractId: null },
    ])
  })

  test('update reassigns regions via set', async () => {
    const headers = new Headers()
    const result = await updateRegionContractWithData(
      CONTRACT_SLUG,
      {
        slug: CONTRACT_SLUG,
        name: 'Vitest contract regions',
        status: 'ACTIVE',
        regionSlugs: [REGION_SLUGS[1], REGION_SLUGS[2]],
      },
      headers,
    )

    expect(result.success).toBe(true)

    const regions = await db.region.findMany({
      where: { slug: { in: [...REGION_SLUGS] } },
      select: { slug: true, contractId: true },
      orderBy: { slug: 'asc' },
    })
    const contract = await db.regionContract.findUniqueOrThrow({ where: { slug: CONTRACT_SLUG } })
    expect(regions).toEqual([
      { slug: REGION_SLUGS[0], contractId: null },
      { slug: REGION_SLUGS[1], contractId: contract.id },
      { slug: REGION_SLUGS[2], contractId: contract.id },
    ])
  })

  test('update clears all regions when regionSlugs is empty', async () => {
    const headers = new Headers()
    const result = await updateRegionContractWithData(
      CONTRACT_SLUG,
      {
        slug: CONTRACT_SLUG,
        name: 'Vitest contract regions',
        status: 'ACTIVE',
        regionSlugs: [],
      },
      headers,
    )

    expect(result.success).toBe(true)

    const regions = await db.region.findMany({
      where: { slug: { in: [...REGION_SLUGS] } },
      select: { slug: true, contractId: true },
      orderBy: { slug: 'asc' },
    })
    expect(regions.every((region) => region.contractId === null)).toBe(true)
  })

  test('allows region assignment when contract is inactive', async () => {
    const headers = new Headers()
    const slug = 'vitest-contract-inactive'

    const createResult = await createRegionContractWithData(
      {
        slug,
        name: 'Vitest inactive contract',
        status: 'INACTIVE',
        regionSlugs: [REGION_SLUGS[0]],
      },
      headers,
    )
    expect(createResult.success).toBe(true)
    if (!createResult.success) throw new Error('expected create success')
    expect(createResult.data.status).toBe('INACTIVE')
    expect(createResult.data.regionSlugs).toEqual([REGION_SLUGS[0]])

    await db.regionContract.deleteMany({ where: { slug } })
    await db.region.update({ where: { slug: REGION_SLUGS[0] }, data: { contractId: null } })
  })
})
