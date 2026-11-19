import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Prisma } from '@/prisma/generated/client'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const { requireAuth, findFirstOrThrow, queryRaw, authorizeSpaceFinderRegion } = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirstOrThrow: vi.fn(),
  queryRaw: vi.fn(),
  authorizeSpaceFinderRegion: vi.fn(),
}))

vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/db.server', () => ({
  default: { spaceFinderRun: { findFirstOrThrow }, $queryRaw: queryRaw },
}))
vi.mock('../authorizeSpaceFinderRegion.server', () => ({ authorizeSpaceFinderRegion }))

import { getSpaceFinderTopHexagons } from './getSpaceFinderTopHexagons.server'

const input = { runId: 42, count: 10, minAreaM2: 0, by: 'area' as const }
const sqlText = () => {
  const [strings, ...values] = queryRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]]
  return Prisma.sql(strings, ...values).sql
}

beforeEach(() => {
  requireAuth.mockReset().mockResolvedValue({ userId: 'u1', role: UserRoleEnum.USER })
  findFirstOrThrow
    .mockReset()
    .mockResolvedValue({ variant: { area: { region: { slug: 'berlin' } } } })
  authorizeSpaceFinderRegion.mockReset().mockResolvedValue(undefined)
  queryRaw.mockReset().mockResolvedValue([])
})

describe('getSpaceFinderTopHexagons', () => {
  test('looks up only finished runs and checks the run’s region', async () => {
    await getSpaceFinderTopHexagons(input, new Headers())
    expect(findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42, status: { in: ['COMPLETE', 'EMPTY'] } },
      }),
    )
    expect(authorizeSpaceFinderRegion).toHaveBeenCalledWith(expect.anything(), 'berlin')
  })

  test('does not query hexagons when the region check fails', async () => {
    authorizeSpaceFinderRegion.mockRejectedValue(new AuthorizationError('no'))
    await expect(getSpaceFinderTopHexagons(input, new Headers())).rejects.toBeInstanceOf(
      AuthorizationError,
    )
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('by area keeps one hexagon per contiguous area, by hexagon does not', async () => {
    await getSpaceFinderTopHexagons(input, new Headers())
    expect(sqlText()).toContain('DISTINCT ON (area_id)')

    queryRaw.mockClear()
    await getSpaceFinderTopHexagons({ ...input, by: 'hexagon' }, new Headers())
    expect(sqlText()).not.toContain('DISTINCT ON')
  })

  test('maps rows to the candidate shape', async () => {
    const geometry = { type: 'Polygon', coordinates: [] }
    queryRaw.mockResolvedValue([
      { h3_id: 'a', coarse_h3_id: 'c', geometry, properties: { mce_gesamtscore: 80 } },
    ])
    await expect(getSpaceFinderTopHexagons(input, new Headers())).resolves.toEqual([
      { h3Id: 'a', coarseH3Id: 'c', geometry, properties: { mce_gesamtscore: 80 } },
    ])
  })
})
