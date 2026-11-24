import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const db = vi.hoisted(() => ({
  membership: { count: vi.fn() },
  externalApiToken: { findUnique: vi.fn(), update: vi.fn() },
}))
const getAppSession = vi.hoisted(() => vi.fn())

vi.mock('@/server/db.server', () => ({ default: db }))
vi.mock('@/server/auth/session.server', () => ({ getAppSession, requireAdmin: vi.fn() }))

import { guardRegionMembership, guardRegionMembershipBySessionOrToken } from './authGuards.server'
import { resetFailedAuthRateLimits } from './failedAuthRateLimit.server'

const input = { headers: new Headers(), regionIds: [11, 12] }
const TOKEN = 'tildageode_ext_test'

function tokenRow(overrides: { expiresAt?: Date; scope?: string; role?: UserRoleEnum } = {}) {
  return {
    id: 'token-1',
    scope: overrides.scope ?? 'uploads',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    lastUsedAt: new Date(),
    user: { id: 'user-1', role: overrides.role ?? UserRoleEnum.USER },
  }
}

beforeEach(() => {
  getAppSession.mockReset()
  db.membership.count.mockReset()
  db.externalApiToken.findUnique.mockReset()
  db.externalApiToken.update.mockReset()
  resetFailedAuthRateLimits()
})

// Used by API routes for member-only files and downloads (non-public uploads, exports, notes).
describe('guardRegionMembership', () => {
  test('guest gets 401, never cached', async () => {
    getAppSession.mockResolvedValue(null)
    const response = await guardRegionMembership(input)

    expect(response?.status).toBe(401)
    expect(response?.headers.get('Cache-Control')).toBe('no-store')
  })

  test('signed-in non-member gets 403, never cached', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    db.membership.count.mockResolvedValue(0)
    const response = await guardRegionMembership(input)

    expect(response?.status).toBe(403)
    expect(response?.headers.get('Cache-Control')).toBe('no-store')
    expect(db.membership.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        regionId: { in: [11, 12] },
        region: { status: { not: 'DEACTIVATED' } },
      },
    })
  })

  test('member of any listed region passes', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    db.membership.count.mockResolvedValue(1)

    await expect(guardRegionMembership(input)).resolves.toBeNull()
  })

  test('admin passes without a membership lookup', async () => {
    getAppSession.mockResolvedValue({ userId: 'admin-1', role: UserRoleEnum.ADMIN })

    await expect(guardRegionMembership(input)).resolves.toBeNull()
    expect(db.membership.count).not.toHaveBeenCalled()
  })
})

describe('guardRegionMembershipBySessionOrToken', () => {
  const guardRaw = (
    headers: Record<string, string> = {},
    overrides: { tokenAccess?: boolean; regionIds?: number[] } = {},
  ) =>
    guardRegionMembershipBySessionOrToken({
      request: new Request('https://tilda-geo.de/api/uploads/x.geojson', { headers }),
      regionIds: overrides.regionIds ?? [11, 12],
      tokenScope: 'uploads',
      tokenAccess: overrides.tokenAccess ?? true,
      responseHeaders: { 'Access-Control-Allow-Origin': '*' },
    })
  // The tests that expect a refusal get the response itself, not `Response | null`.
  const guard = async (...args: Parameters<typeof guardRaw>) => {
    const response = await guardRaw(...args)
    if (!response) throw new Error('expected an error response, access was granted')
    return response
  }
  const bearer = (token = TOKEN) => ({ Authorization: `Bearer ${token}` })

  beforeEach(() => {
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow())
    db.membership.count.mockResolvedValue(1)
    getAppSession.mockImplementation(() => {
      throw new Error('cookie session must not be used')
    })
  })

  test('Bearer: member passes and the cookie is not read', async () => {
    await expect(guardRaw(bearer())).resolves.toBeNull()
    expect(getAppSession).not.toHaveBeenCalled()
  })

  test('Bearer: admin passes without a membership lookup', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ role: UserRoleEnum.ADMIN }))

    await expect(guardRaw(bearer())).resolves.toBeNull()
    expect(db.membership.count).not.toHaveBeenCalled()
  })

  test('Bearer: non-member gets 403 not_member in the external API format', async () => {
    db.membership.count.mockResolvedValue(0)
    const response = await guard(bearer())

    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('not_member')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  test('Bearer: a member of a file without token access gets 403 token_access_disabled', async () => {
    const response = await guard(bearer(), { tokenAccess: false })

    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('token_access_disabled')
  })

  test('Bearer: an outsider learns nothing about token access (not_member first)', async () => {
    db.membership.count.mockResolvedValue(0)
    const response = await guard(bearer(), { tokenAccess: false })

    expect((await response.json()).error).toBe('not_member')
  })

  test('Bearer: no regions is 403 for a non-admin', async () => {
    db.membership.count.mockResolvedValue(1)
    const response = await guard(bearer(), { regionIds: [] })

    expect(response.status).toBe(403)
    expect(db.membership.count).not.toHaveBeenCalled()
  })

  test('Bearer: token of another scope or unknown is 401 invalid_token with WWW-Authenticate', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ scope: 'notes' }))
    const wrongScope = await guard(bearer())
    expect(wrongScope.status).toBe(401)
    expect((await wrongScope.json()).error).toBe('invalid_token')
    expect(wrongScope.headers.get('WWW-Authenticate')).toBe('Bearer')

    db.externalApiToken.findUnique.mockResolvedValue(null)
    const unknown = await guard(bearer('tildageode_ext_unknown'))
    expect((await unknown.json()).error).toBe('invalid_token')
  })

  test('Bearer: expired token is 401 token_expired', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    const response = await guard(bearer())

    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('token_expired')
  })

  test('another Authorization scheme (Basic) uses the cookie', async () => {
    getAppSession.mockReset()
    getAppSession.mockResolvedValue(null)
    const response = await guard({ Authorization: 'Basic dXNlcjpwYXNz' })

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ statusText: 'Unauthorized' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('no header: cookie member passes, non-member gets 403 { statusText, message }', async () => {
    getAppSession.mockReset()
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    await expect(guardRaw()).resolves.toBeNull()

    db.membership.count.mockResolvedValue(0)
    const response = await guard()
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ statusText: 'Forbidden' })
  })

  test('the cookie path ignores tokenAccess (it is only about tokens)', async () => {
    getAppSession.mockReset()
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })

    await expect(guardRaw({}, { tokenAccess: false })).resolves.toBeNull()
  })

  test('429 with Retry-After after 20 invalid tokens; expired tokens are not counted', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    for (let attempt = 0; attempt < 25; attempt++) {
      expect((await guard(bearer())).status).toBe(401)
    }

    db.externalApiToken.findUnique.mockResolvedValue(null)
    for (let attempt = 0; attempt < 20; attempt++) {
      expect((await guard(bearer('tildageode_ext_unknown'))).status).toBe(401)
    }
    const limited = await guard(bearer('tildageode_ext_unknown'))
    expect(limited.status).toBe(429)
    expect((await limited.json()).error).toBe('rate_limited')
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})
