import { beforeEach, describe, expect, test, vi } from 'vitest'

const { fetchOsmUserDetails, userFindUnique, tokenCreate, tokenDeleteMany } = vi.hoisted(() => ({
  fetchOsmUserDetails: vi.fn(),
  userFindUnique: vi.fn(),
  tokenCreate: vi.fn(),
  tokenDeleteMany: vi.fn(),
}))

vi.mock('@/server/auth/osmUserDetails.server', () => ({ fetchOsmUserDetails }))
vi.mock('@/server/db.server', () => ({
  default: {
    user: { findUnique: userFindUnique },
    externalApiToken: { create: tokenCreate, deleteMany: tokenDeleteMany },
  },
}))

import { exchangeOsmToken } from '@/server/api/auth/osmToken.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'
import { resetFailedAuthRateLimits } from '@/server/api/util/failedAuthRateLimit.server'
import {
  EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS,
  EXTERNAL_API_TOKEN_PREFIX,
  EXTERNAL_API_TOKEN_TTL_MS,
} from '@/server/auth/externalApiToken.const'
import { requireExternalSession } from '@/server/auth/externalSession.server'

const OSM_TOKEN = 'osm-access-token-secret'

async function exchange(headers: Record<string, string>, query = '') {
  const request = new Request(`https://tilda-geo.de/api/auth/osm-token${query}`, {
    method: 'POST',
    headers,
  })
  const response = await handleExternalApiRequest(async () => ({
    status: 201,
    body: await exchangeOsmToken(request),
  }))
  return { response, body: await response.json() }
}

beforeEach(() => {
  resetFailedAuthRateLimits()
  fetchOsmUserDetails.mockReset()
  userFindUnique.mockReset()
  tokenCreate.mockReset()
  tokenDeleteMany.mockReset()
  fetchOsmUserDetails.mockResolvedValue({
    ok: true,
    user: { osmId: 123, osmName: 'mapper', osmDescription: '', osmAvatar: null },
  })
  userFindUnique.mockResolvedValue({
    id: 'user-1',
    osmId: 123,
    osmName: 'mapper',
    firstName: null,
    lastName: null,
  })
})

describe('POST /api/auth/osm-token', () => {
  test('missing Authorization header is 401 and OSM is not asked', async () => {
    const { response, body } = await exchange({})

    expect(response.status).toBe(401)
    expect(body.error).toBe('missing_token')
    expect(fetchOsmUserDetails).not.toHaveBeenCalled()
  })

  test('OSM token that OSM rejects is 401 invalid_osm_token', async () => {
    fetchOsmUserDetails.mockResolvedValue({ ok: false, status: 401, statusText: '', errorText: '' })
    const { response, body } = await exchange({ Authorization: `Bearer ${OSM_TOKEN}` })

    expect(response.status).toBe(401)
    expect(body.error).toBe('invalid_osm_token')
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('OSM being down is 502, not an auth error', async () => {
    fetchOsmUserDetails.mockRejectedValue(new Error('network'))
    expect((await exchange({ Authorization: `Bearer ${OSM_TOKEN}` })).response.status).toBe(502)

    fetchOsmUserDetails.mockResolvedValue({ ok: false, status: 503, statusText: '', errorText: '' })
    const { response, body } = await exchange({ Authorization: `Bearer ${OSM_TOKEN}` })
    expect(response.status).toBe(502)
    expect(body.error).toBe('osm_unavailable')
  })

  test('OSM user without a TILDA account is 403 no_tilda_user; no user and no token is created', async () => {
    userFindUnique.mockResolvedValue(null)
    const { response, body } = await exchange({ Authorization: `Bearer ${OSM_TOKEN}` })

    expect(response.status).toBe(403)
    expect(body.error).toBe('no_tilda_user')
    expect(userFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { osmId: 123 } }))
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('returns a short-lived TILDA token; only its hash is stored, the OSM token nowhere', async () => {
    const before = Date.now()
    const { response, body } = await exchange({ Authorization: `Bearer ${OSM_TOKEN}` })

    expect(response.status).toBe(201)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body).toMatchObject({
      tokenType: 'Bearer',
      scope: 'notes',
      user: { id: 'user-1', osmId: 123, name: 'mapper' },
    })
    expect(body.token.startsWith(EXTERNAL_API_TOKEN_PREFIX)).toBe(true)
    const expiresIn = new Date(body.expiresAt).getTime() - before
    expect(expiresIn).toBeGreaterThan(0)
    expect(expiresIn).toBeLessThanOrEqual(EXTERNAL_API_TOKEN_TTL_MS + 1000)

    expect(fetchOsmUserDetails).toHaveBeenCalledWith(OSM_TOKEN)
    const stored = JSON.stringify(tokenCreate.mock.calls)
    expect(stored).not.toContain(OSM_TOKEN)
    expect(stored).not.toContain(body.token)
    expect(tokenCreate.mock.calls[0]?.[0].data).toMatchObject({ scope: 'notes', userId: 'user-1' })
    // Old tokens are cleared on the way; recently expired ones stay for `token_expired`.
    const cutoff = tokenDeleteMany.mock.calls[0]?.[0].where.expiresAt.lt as Date
    expect(Date.now() - cutoff.getTime()).toBeGreaterThanOrEqual(
      EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS - 1000,
    )
  })

  test('?scope=uploads issues a token of scope uploads', async () => {
    const { response, body } = await exchange(
      { Authorization: `Bearer ${OSM_TOKEN}` },
      '?scope=uploads',
    )

    expect(response.status).toBe(201)
    expect(body.scope).toBe('uploads')
    expect(tokenCreate.mock.calls[0]?.[0].data).toMatchObject({
      scope: 'uploads',
      userId: 'user-1',
    })
  })

  test('?scope=notes is the same as no scope', async () => {
    const { body } = await exchange({ Authorization: `Bearer ${OSM_TOKEN}` }, '?scope=notes')

    expect(body.scope).toBe('notes')
  })

  test('unknown scope is 400 invalid_input; OSM is not asked and no token is created', async () => {
    const { response, body } = await exchange(
      { Authorization: `Bearer ${OSM_TOKEN}` },
      '?scope=admin',
    )

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_input')
    expect(body.info).toEqual({ allowed: ['notes', 'uploads'] })
    expect(fetchOsmUserDetails).not.toHaveBeenCalled()
    expect(tokenCreate).not.toHaveBeenCalled()
  })
})

describe('rate limit of failed attempts', () => {
  const failedExchange = () => exchange({})

  test('429 with Retry-After after 20 failed exchanges; the exchange has its own bucket', async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      expect((await failedExchange()).response.status).toBe(401)
    }
    const { response, body } = await failedExchange()
    expect(response.status).toBe(429)
    expect(body.error).toBe('rate_limited')
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0)

    // The API calls of the same IP are not locked out by failed exchanges.
    const request = new Request('https://tilda-geo.de/api/notes/berlin/7')
    await expect(requireExternalSession(request, 'notes')).rejects.toMatchObject({
      code: 'missing_token',
    })
  })
})
