import { describe, expect, test, vi } from 'vitest'

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}))

vi.mock('@/server/prisma-client.server', () => ({
  geoDataClient: { $queryRaw: queryRaw },
}))

import { lookupBoundaryOsmIds } from './lookupBoundaryOsmIds.server'

describe('lookupBoundaryOsmIds', () => {
  test('returns empty for no ids', async () => {
    expect(await lookupBoundaryOsmIds([])).toEqual({ found: [], missing: [] })
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('splits found vs missing', async () => {
    queryRaw.mockResolvedValueOnce([{ osm_id: 62422n }])
    expect(await lookupBoundaryOsmIds([62422, 1])).toEqual({
      found: [62422],
      missing: [1],
    })
  })
})
