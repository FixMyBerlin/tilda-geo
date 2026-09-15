import { describe, expect, test, vi } from 'vitest'

const { lookupBoundaryOsmIds, queryRaw } = vi.hoisted(() => ({
  lookupBoundaryOsmIds: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock('@/server/prisma-client.server', () => ({
  geoDataClient: { $queryRaw: queryRaw },
}))
vi.mock('@/server/regions/masks/lookupBoundaryOsmIds.server', () => ({ lookupBoundaryOsmIds }))

import { BoundaryNotFoundError, fetchBoundaryGeometry } from './fetchBoundaryGeometry.server'

const square = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [13.0, 52.0],
      [13.1, 52.0],
      [13.1, 52.1],
      [13.0, 52.1],
      [13.0, 52.0],
    ],
  ],
}

describe('fetchBoundaryGeometry', () => {
  test('names the missing ids instead of querying geometry', async () => {
    lookupBoundaryOsmIds.mockResolvedValueOnce({ found: [62422], missing: [62504] })

    await expect(fetchBoundaryGeometry([62422, 62504])).rejects.toThrow(
      expect.objectContaining({
        name: 'BoundaryNotFoundError',
        missingOsmIds: [62504],
      }),
    )
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('throws when no ids are given', async () => {
    lookupBoundaryOsmIds.mockResolvedValueOnce({ found: [], missing: [] })

    await expect(fetchBoundaryGeometry([])).rejects.toThrow(BoundaryNotFoundError)
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('returns union and buffered geometry', async () => {
    lookupBoundaryOsmIds.mockResolvedValueOnce({ found: [62422], missing: [] })
    queryRaw.mockResolvedValueOnce([{ geom: square, buffered_geom: square }])

    await expect(fetchBoundaryGeometry([62422], 10)).resolves.toEqual({
      geometry: square,
      bufferedGeometry: square,
    })
  })
})
