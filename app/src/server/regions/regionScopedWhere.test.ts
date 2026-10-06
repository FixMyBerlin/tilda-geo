import { describe, expect, test } from 'vitest'
import {
  qaConfigsInRegionWhere,
  regionAuditHistoryWhere,
  reviewListsInRegionWhere,
  usersInRegionWhere,
} from './regionScopedWhere'

describe('region scoped where clauses', () => {
  test('match the region by slug', () => {
    expect(usersInRegionWhere('bb')).toEqual({
      memberships: { some: { region: { slug: 'bb' } } },
    })
    expect(qaConfigsInRegionWhere('bb')).toEqual({ region: { slug: 'bb' } })
    expect(reviewListsInRegionWhere('bb')).toEqual({ regions: { some: { slug: 'bb' } } })
  })

  test('audit history covers the region row and its assignment rows', () => {
    const where = regionAuditHistoryWhere(7)
    expect(where.OR).toContainEqual({ model: 'Region', recordId: '7' })
    expect(where.OR).toContainEqual({
      model: 'RegionCategoryAssignment',
      newData: { path: ['regionId'], equals: 7 },
    })
    expect(where.OR).toContainEqual({
      model: 'RegionNavigationLink',
      oldData: { path: ['regionId'], equals: 7 },
    })
    // Region row + old/new data for each of the four assignment models.
    expect(where.OR).toHaveLength(9)
  })
})
