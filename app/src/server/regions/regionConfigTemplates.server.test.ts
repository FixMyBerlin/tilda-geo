import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { simplifyConfigForParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { calcConfigChecksum } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/lib'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'

const { upsert, findUnique } = vi.hoisted(() => ({
  upsert: vi.fn(async () => ({})),
  findUnique: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { regionConfigTemplate: { upsert, findUnique } },
}))

import { getRegionConfigTemplate, upsertRegionConfigTemplate } from './regionConfigTemplates.server'

beforeEach(() => {
  upsert.mockClear()
  findUnique.mockClear()
})

describe('upsertRegionConfigTemplate', () => {
  test('upserts with the checksum + simplified template for the given categories', async () => {
    const categories = ['poi', 'roads'] as MapDataCategoryId[]
    const fresh = createFreshCategoriesConfig(categories)
    const checksum = calcConfigChecksum(fresh)
    const template = simplifyConfigForParams(fresh)

    const result = await upsertRegionConfigTemplate(categories)

    expect(result).toBe(checksum)
    expect(upsert).toHaveBeenCalledWith({
      where: { checksum },
      create: { checksum, template },
      update: {},
    })
  })
})

describe('getRegionConfigTemplate', () => {
  test('round-trips a stored template and memoises (second call does not re-query)', async () => {
    const checksum = 'storetestmemoisechecksum'
    const template = [{ id: 'poi', active: true, subcategories: [] }]
    findUnique.mockResolvedValueOnce({ checksum, template, createdAt: new Date() })

    const first = await getRegionConfigTemplate(checksum)
    const second = await getRegionConfigTemplate(checksum)

    expect(first).toEqual(template)
    expect(second).toEqual(template)
    expect(findUnique).toHaveBeenCalledTimes(1)
  })

  test('returns undefined for an unknown checksum', async () => {
    findUnique.mockResolvedValueOnce(null)
    const result = await getRegionConfigTemplate('storetestunknownchecksum')
    expect(result).toBeUndefined()
  })
})
