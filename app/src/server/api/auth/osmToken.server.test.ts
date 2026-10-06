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
import {
  EXTERNAL_API_TOKEN_PREFIX,
  EXTERNAL_API_TOKEN_TTL_MS,
} from '@/server/auth/externalApiToken.const'

const OSM_TOKEN = 'osm-access-token-secret'

async function exchange(headers: Record<string, string>) {
  const request = new Request('https://tilda-geo.de/api/auth/osm-token', {
    method: 'POST',
    headers,
  })
  const response = await handleExternalApiRequest(request, async () => ({
    status: 201,
    body: await exchangeOsmToken(request),
  }))
  return { response, body: await response.json() }
}

beforeEach(() => {
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
    // Expired tokens are cleared on the way.
    expect(tokenDeleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lt: expect.any(Date) } } })
  })
})
