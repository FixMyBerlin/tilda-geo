import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { getAppSession, findUnique, findFirst } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { privateBackgroundSource: { findUnique, findFirst } },
}))
vi.mock('@/server/auth/session.server', () => ({ getAppSession }))

import { proxyPrivateBackgroundTile } from './proxyPrivateBackgroundTile.server'

const upstreamTilesUrl = 'https://tiles.example.com/{z}/{x}/{y}.jpg?token=SECRET'
const params = { slug: 'berlin-dop', z: '15', x: '17603', y: '10747' }
const request = new Request('http://localhost/api/private-backgrounds/berlin-dop/15/17603/10747')
const member = { userId: 'user-1', role: UserRoleEnum.USER }
const fetchMock = vi.fn()

const imageResponse = () =>
  new Response('tile-bytes', {
    headers: { 'content-type': 'image/jpeg', 'x-upstream': upstreamTilesUrl },
  })

beforeEach(() => {
  getAppSession.mockReset()
  findUnique.mockReset()
  findFirst.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// Tiles of private background sources: member/admin only, the upstream URL (token) stays here.
describe('proxyPrivateBackgroundTile', () => {
  test('guest gets 401 before any lookup', async () => {
    getAppSession.mockResolvedValue(null)

    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(401)
    expect(findFirst).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('signed-in non-member gets 403 and nothing is fetched', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue(null)

    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('membership must be in a linked region that is not DEACTIVATED', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue(null)

    await proxyPrivateBackgroundTile(request, params)

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        slug: 'berlin-dop',
        regions: {
          some: {
            status: { not: 'DEACTIVATED' },
            memberships: { some: { userId: 'user-1' } },
          },
        },
      },
      select: { tilesUrl: true },
    })
  })

  test('member gets the image, fetched with the token, without upstream headers', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ tilesUrl: upstreamTilesUrl })
    fetchMock.mockResolvedValue(imageResponse())

    const response = await proxyPrivateBackgroundTile(request, params)

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://tiles.example.com/15/17603/10747.jpg?token=SECRET',
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('tile-bytes')
    expect(Object.fromEntries(response.headers)).toEqual({
      'content-type': 'image/jpeg',
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=604800',
    })
  })

  test('admin passes without a membership and gets 404 for an unknown slug', async () => {
    getAppSession.mockResolvedValue({ userId: 'admin-1', role: UserRoleEnum.ADMIN })
    findUnique.mockResolvedValueOnce({ tilesUrl: upstreamTilesUrl }).mockResolvedValueOnce(null)
    fetchMock.mockResolvedValue(imageResponse())

    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(200)
    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(404)
    expect(findFirst).not.toHaveBeenCalled()
  })

  test.each([
    { ...params, z: '15/../..' },
    { ...params, x: '1&token=x' },
    { ...params, y: '10747.jpg' },
    { ...params, slug: 'Berlin_DOP' },
  ])('rejects params that are not plain tile coordinates: %o', async (badParams) => {
    getAppSession.mockResolvedValue(member)

    expect((await proxyPrivateBackgroundTile(request, badParams)).status).toBe(400)
    expect(findFirst).not.toHaveBeenCalled()
  })

  test('upstream error pages are not passed on (they can echo the token)', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ tilesUrl: upstreamTilesUrl })
    fetchMock.mockResolvedValue(
      new Response(`Invalid request ${upstreamTilesUrl}`, {
        status: 403,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const response = await proxyPrivateBackgroundTile(request, params)

    expect(response.status).toBe(502)
    expect(await response.text()).toBe('')
  })

  test('SVG is not passed on (it could run script on our origin)', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ tilesUrl: upstreamTilesUrl })
    fetchMock.mockResolvedValue(
      new Response('<svg onload="alert(1)"/>', { headers: { 'content-type': 'image/svg+xml' } }),
    )

    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(502)
  })

  test('a failed upstream request answers 502 and does not log the URL', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ tilesUrl: upstreamTilesUrl })
    fetchMock.mockRejectedValue(new TypeError(`fetch failed ${upstreamTilesUrl}`))

    const response = await proxyPrivateBackgroundTile(request, params)

    expect(response.status).toBe(502)
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('SECRET')
  })

  test('missing tiles keep their status so the map shows no error', async () => {
    getAppSession.mockResolvedValue(member)
    findFirst.mockResolvedValue({ tilesUrl: upstreamTilesUrl })
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    expect((await proxyPrivateBackgroundTile(request, params)).status).toBe(404)
  })
})
