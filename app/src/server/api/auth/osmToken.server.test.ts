import { beforeEach, describe, expect, test, vi } from 'vitest'

const { fetchOsmTokenInfo, userFindUnique, tokenCreate, tokenDeleteMany } = vi.hoisted(() => ({
  fetchOsmTokenInfo: vi.fn(),
  userFindUnique: vi.fn(),
  tokenCreate: vi.fn(),
  tokenDeleteMany: vi.fn(),
}))

vi.mock('@/server/auth/osmTokenInfo.server', () => ({ fetchOsmTokenInfo }))
// Test apps, so the tests do not depend on the real allow-list.
vi.mock('@/server/auth/externalApiToken.const', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/auth/externalApiToken.const')>()),
  EXTERNAL_API_OSM_APPS: [
    { name: 'full-app', osmClientId: 'full-app-client-id', scopes: ['notes', 'uploads'] },
    { name: 'notes-app', osmClientId: 'notes-app-client-id', scopes: ['notes'] },
  ],
}))
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
const ALLOWED_APP_CLIENT_ID = 'full-app-client-id'
const NOTES_ONLY_APP_CLIENT_ID = 'notes-app-client-id'
const UNKNOWN_APP_CLIENT_ID = 'some-other-osm-app'
const bearer = { Authorization: `Bearer ${OSM_TOKEN}` }

async function exchange(headers: Record<string, string>, query = '?scope=notes') {
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
  fetchOsmTokenInfo.mockReset()
  userFindUnique.mockReset()
  tokenCreate.mockReset()
  tokenDeleteMany.mockReset()
  fetchOsmTokenInfo.mockResolvedValue({
    ok: true,
    osmId: 123,
    osmClientId: ALLOWED_APP_CLIENT_ID,
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
    expect(fetchOsmTokenInfo).not.toHaveBeenCalled()
  })

  test('OSM token that OSM rejects is 401 invalid_osm_token', async () => {
    fetchOsmTokenInfo.mockResolvedValue({ ok: false, status: 401 })
    const { response, body } = await exchange(bearer)

    expect(response.status).toBe(401)
    expect(body.error).toBe('invalid_osm_token')
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('OSM being down is 502, not an auth error', async () => {
    fetchOsmTokenInfo.mockRejectedValue(new Error('network'))
    expect((await exchange(bearer)).response.status).toBe(502)

    fetchOsmTokenInfo.mockResolvedValue({ ok: false, status: 503 })
    const { response, body } = await exchange(bearer)
    expect(response.status).toBe(502)
    expect(body.error).toBe('osm_unavailable')
  })

  test('OSM user without a TILDA account is 403 no_tilda_user; no user and no token is created', async () => {
    userFindUnique.mockResolvedValue(null)
    const { response, body } = await exchange(bearer)

    expect(response.status).toBe(403)
    expect(body.error).toBe('no_tilda_user')
    expect(userFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { osmId: 123 } }))
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('returns a short-lived TILDA token; only its hash is stored, the OSM token nowhere', async () => {
    const before = Date.now()
    const { response, body } = await exchange(bearer)

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

    expect(fetchOsmTokenInfo).toHaveBeenCalledWith(OSM_TOKEN)
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
    const { response, body } = await exchange(bearer, '?scope=uploads')

    expect(response.status).toBe(201)
    expect(body.scope).toBe('uploads')
    expect(tokenCreate.mock.calls[0]?.[0].data).toMatchObject({
      scope: 'uploads',
      userId: 'user-1',
    })
  })

  test('missing scope is 400 invalid_input listing the scopes; OSM is not asked and no token is created', async () => {
    const { response, body } = await exchange(bearer, '')

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_input')
    expect(body.info).toEqual({ allowed: ['notes', 'uploads'] })
    expect(fetchOsmTokenInfo).not.toHaveBeenCalled()
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('unknown scope is 400 invalid_input; OSM is not asked and no token is created', async () => {
    const { response, body } = await exchange(bearer, '?scope=admin')

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_input')
    expect(body.info).toEqual({ allowed: ['notes', 'uploads'] })
    expect(fetchOsmTokenInfo).not.toHaveBeenCalled()
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('token of an OSM app that is not on the list is 403 app_not_allowed; no user lookup, no token', async () => {
    fetchOsmTokenInfo.mockResolvedValue({
      ok: true,
      osmId: 123,
      osmClientId: UNKNOWN_APP_CLIENT_ID,
    })
    const { response, body } = await exchange(bearer, '?scope=uploads')

    expect(response.status).toBe(403)
    expect(body.error).toBe('app_not_allowed')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(userFindUnique).not.toHaveBeenCalled()
    expect(tokenCreate).not.toHaveBeenCalled()
  })

  test('app that is not allowed the requested scope is 403 app_not_allowed; its own scope works', async () => {
    fetchOsmTokenInfo.mockResolvedValue({
      ok: true,
      osmId: 123,
      osmClientId: NOTES_ONLY_APP_CLIENT_ID,
    })
    expect((await exchange(bearer, '?scope=notes')).response.status).toBe(201)

    const { response, body } = await exchange(bearer, '?scope=uploads')
    expect(response.status).toBe(403)
    expect(body.error).toBe('app_not_allowed')
    expect(tokenCreate).toHaveBeenCalledTimes(1)
  })
})

describe('rate limit of failed attempts', () => {
  const fromIp = (ip: string) => ({ 'X-Forwarded-For': ip })
  // A failed exchange has a token that OSM rejects; one without a token is not counted.
  const failedExchange = (ip = '203.0.113.5') => {
    fetchOsmTokenInfo.mockResolvedValue({ ok: false, status: 401 })
    return exchange({ ...fromIp(ip), ...bearer })
  }

  test('429 with Retry-After after 20 failed exchanges; the exchange has its own bucket', async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      expect((await failedExchange()).response.status).toBe(401)
    }
    const { response, body } = await failedExchange()
    expect(response.status).toBe(429)
    expect(body.error).toBe('rate_limited')
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0)

    // The API calls of the same IP are not locked out by failed exchanges.
    const request = new Request('https://tilda-geo.de/api/notes/berlin/7', {
      headers: fromIp('203.0.113.5'),
    })
    await expect(requireExternalSession(request, 'notes')).rejects.toMatchObject({
      code: 'missing_token',
    })
  })

  test('two IPs have separate buckets', async () => {
    for (let attempt = 0; attempt < 20; attempt++) await failedExchange('203.0.113.5')

    expect((await failedExchange('203.0.113.5')).response.status).toBe(429)
    expect((await failedExchange('198.51.100.7')).response.status).toBe(401)
    fetchOsmTokenInfo.mockResolvedValue({
      ok: true,
      osmId: 123,
      osmClientId: ALLOWED_APP_CLIENT_ID,
    })
    expect(
      (await exchange({ ...fromIp('198.51.100.7'), ...bearer }, '?scope=notes')).response.status,
    ).toBe(201)
  })

  test('a request without a token is not a failed attempt: any web page can send one', async () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const { response, body } = await exchange({
        ...fromIp('203.0.113.5'),
        Origin: 'https://other.example',
      })
      expect(response.status).toBe(401)
      expect(body.error).toBe('missing_token')
    }

    // Still free for the same IP: the exchange of a mapper behind it works.
    expect((await exchange({ ...fromIp('203.0.113.5'), ...bearer })).response.status).toBe(201)
    expect(fetchOsmTokenInfo).toHaveBeenCalledTimes(1)
  })

  test('without a client IP header nothing is limited', async () => {
    fetchOsmTokenInfo.mockResolvedValue({ ok: false, status: 401 })
    for (let attempt = 0; attempt < 30; attempt++) {
      expect((await exchange(bearer)).response.status).toBe(401)
    }
  })

  test('an app that is not allowed counts as a failed exchange', async () => {
    fetchOsmTokenInfo.mockResolvedValue({
      ok: true,
      osmId: 123,
      osmClientId: UNKNOWN_APP_CLIENT_ID,
    })
    for (let attempt = 0; attempt < 20; attempt++) {
      expect((await exchange({ ...fromIp('203.0.113.5'), ...bearer })).response.status).toBe(403)
    }
    const { response, body } = await exchange({ ...fromIp('203.0.113.5'), ...bearer })
    expect(response.status).toBe(429)
    expect(body.error).toBe('rate_limited')
    expect(fetchOsmTokenInfo).toHaveBeenCalledTimes(20)
  })

  test('OSM not answering (timeout, network error, 5xx) counts as failed: no endless loop against OSM', async () => {
    const attempts = [
      () => fetchOsmTokenInfo.mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
      () => fetchOsmTokenInfo.mockRejectedValue(new Error('network')),
      () => fetchOsmTokenInfo.mockResolvedValue({ ok: false, status: 503 }),
    ]
    for (let attempt = 0; attempt < 20; attempt++) {
      attempts[attempt % attempts.length]?.()
      expect((await exchange({ ...fromIp('203.0.113.5'), ...bearer })).response.status).toBe(502)
    }
    const { response, body } = await exchange({ ...fromIp('203.0.113.5'), ...bearer })
    expect(response.status).toBe(429)
    expect(body.error).toBe('rate_limited')
    expect(fetchOsmTokenInfo).toHaveBeenCalledTimes(20)
  })
})

describe('log of the token exchange', () => {
  test('one line with app, scope and TILDA user id; never a token', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    try {
      const { body } = await exchange(bearer, '?scope=uploads')

      expect(info).toHaveBeenCalledTimes(1)
      const line = String(info.mock.calls[0]?.[0])
      expect(line).toContain('full-app')
      expect(line).toContain('uploads')
      expect(line).toContain('user-1')
      expect(line).not.toContain(OSM_TOKEN)
      expect(line).not.toContain(body.token)
    } finally {
      info.mockRestore()
    }
  })
})
