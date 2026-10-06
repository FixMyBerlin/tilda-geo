import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { adminApiTokenFindUnique } = vi.hoisted(() => ({ adminApiTokenFindUnique: vi.fn() }))

vi.mock('@/server/db.server', () => ({
  default: { adminApiToken: { findUnique: adminApiTokenFindUnique, update: vi.fn() } },
}))

import { ADMIN_API_TOKEN_PREFIX } from '@/server/admin/adminApiTokenPrefix.const'
import { guardAdminApi } from './guardAdminApi.server'

const token = `${ADMIN_API_TOKEN_PREFIX}secret`
let requestCount = 0
// Distinct client IP per request so the failed-auth rate limit never kicks in across tests.
const request = (authorization?: string) =>
  new Request('https://tilda-geo.de/mcp', {
    method: 'POST',
    headers: {
      'x-forwarded-for': `10.0.0.${++requestCount}`,
      ...(authorization ? { authorization } : {}),
    },
  })

const tokenRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'token-1',
  createdById: 'admin-1',
  revokedAt: null,
  lastUsedAt: new Date(),
  createdBy: { role: UserRoleEnum.ADMIN },
  ...overrides,
})

beforeEach(() => {
  adminApiTokenFindUnique.mockReset()
})

// Guards /mcp and api/admin/*: admin-equivalent access (see docs/Permissions.md).
describe('guardAdminApi', () => {
  test.each([
    ['no Authorization header', undefined],
    ['a non-Bearer header', `Basic ${token}`],
    ['a token without the admin prefix', 'Bearer something-else'],
  ])('rejects %s with 401', async (_, authorization) => {
    const result = await guardAdminApi(request(authorization))
    expect(result.access).toBe(false)
    expect(result.response?.status).toBe(401)
  })

  test.each([
    ['unknown', null],
    ['revoked', tokenRow({ revokedAt: new Date() })],
    ['owned by a demoted user', tokenRow({ createdBy: { role: UserRoleEnum.USER } })],
  ])('rejects an %s token with 401', async (_, row) => {
    adminApiTokenFindUnique.mockResolvedValue(row)

    const result = await guardAdminApi(request(`Bearer ${token}`))
    expect(result.access).toBe(false)
    expect(result.response?.status).toBe(401)
  })

  test('accepts a valid admin token and attributes it to the owner', async () => {
    adminApiTokenFindUnique.mockResolvedValue(tokenRow())

    const result = await guardAdminApi(request(`Bearer ${token}`))
    expect(result.access).toBe(true)
    expect(result.auth).toEqual({ tokenId: 'token-1', createdById: 'admin-1', changeSource: 'API' })
  })
})
