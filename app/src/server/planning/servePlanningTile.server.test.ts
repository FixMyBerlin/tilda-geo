import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { getAppSession, findFirst, queryRaw } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  findFirst: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({ default: { planningRun: { findFirst } } }))
vi.mock('@/server/prisma-client.server', () => ({ geoDataClient: { $queryRaw: queryRaw } }))
vi.mock('@/server/auth/session.server', () => ({ getAppSession }))

import { servePlanningTile } from './servePlanningTile.server'

const params = { regionSlug: 'berlin', layer: 'hexagons', z: '15', x: '17603', y: '10747' }
const requestFor = (query = '?run_id=42') =>
  new Request(`http://localhost/api/regions/berlin/planning-tiles/hexagons/15/17603/10747${query}`)
const member = { userId: 'user-1', role: UserRoleEnum.USER }
const admin = { userId: 'admin-1', role: UserRoleEnum.ADMIN }

beforeEach(() => {
  getAppSession.mockReset()
  findFirst.mockReset()
  queryRaw.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('servePlanningTile', () => {
  test('guest gets 401 before any lookup', async () => {
    getAppSession.mockResolvedValue(null)

    expect((await servePlanningTile(requestFor(), params)).status).toBe(401)
    expect(findFirst).not.toHaveBeenCalled()
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test.each([
    ['unknown layer', { ...params, layer: 'areas' }, '?run_id=42'],
    ['non-numeric z', { ...params, z: 'a' }, '?run_id=42'],
    ['non-numeric x', { ...params, x: '1;DROP' }, '?run_id=42'],
    ['missing run_id', params, ''],
    ['non-numeric run_id', params, '?run_id=abc'],
    ['bad slug', { ...params, regionSlug: 'Berlin; --' }, '?run_id=42'],
  ])('%s gets 400 without any query', async (_name, p, query) => {
    getAppSession.mockResolvedValue(member)

    expect((await servePlanningTile(requestFor(query), p)).status).toBe(400)
    expect(findFirst).not.toHaveBeenCalled()
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('member check: run in this region, flag on, membership', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue(null)

    await servePlanningTile(requestFor(), params)

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 42,
        variant: {
          area: {
            region: {
              slug: 'berlin',
              spaceFinderEnabled: true,
              memberships: { some: { userId: 'user-1' } },
            },
          },
        },
      },
      select: { id: true },
    })
  })

  test('non-member, flag off, other region or unknown run/slug all get 403, nothing is queried', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue(null)

    expect((await servePlanningTile(requestFor(), params)).status).toBe(403)
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('admin skips the membership but still needs the flag and a run of the region', async () => {
    getAppSession.mockResolvedValue(admin)
    findFirst.mockResolvedValue(null)

    const response = await servePlanningTile(requestFor(), params)

    expect(response.status).toBe(404)
    expect(findFirst.mock.calls[0]?.[0].where.variant.area.region).toEqual({
      slug: 'berlin',
      spaceFinderEnabled: true,
    })
    expect(queryRaw).not.toHaveBeenCalled()
  })

  test('member gets the tile with a private cache', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ id: 42 })
    queryRaw.mockResolvedValue([{ mvt: new Uint8Array([1, 2, 3]) }])

    const response = await servePlanningTile(requestFor(), params)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/vnd.mapbox-vector-tile')
    expect(response.headers.get('cache-control')).toBe('private, max-age=604800')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
    expect(queryRaw).toHaveBeenCalledTimes(1)
    expect(queryRaw.mock.calls[0]?.[0].strings.join('?')).toContain('planning.planning_hexagons(')
  })

  test('layer picks its own function', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ id: 42 })
    queryRaw.mockResolvedValue([{ mvt: new Uint8Array([1]) }])

    await servePlanningTile(requestFor(), { ...params, layer: 'census' })

    expect(queryRaw.mock.calls[0]?.[0].strings.join('?')).toContain('planning.planning_census(')
  })

  test.each([[null], [new Uint8Array()]])('empty tile %# gives 204', async (mvt) => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ id: 42 })
    queryRaw.mockResolvedValue([{ mvt }])

    expect((await servePlanningTile(requestFor(), params)).status).toBe(204)
  })
})
