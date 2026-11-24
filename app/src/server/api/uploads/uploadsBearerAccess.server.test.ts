import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const db = vi.hoisted(() => ({
  mapDatasetUpload: { findFirst: vi.fn() },
  externalApiToken: { findUnique: vi.fn(), update: vi.fn() },
  membership: { count: vi.fn() },
}))
const { getAppSession, proxyS3Url } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  proxyS3Url: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({ default: db }))
vi.mock('@/server/auth/session.server', () => ({ getAppSession, requireAdmin: vi.fn() }))
vi.mock('@/server/api/uploads/proxyS3Url.server', () => ({ proxyS3Url }))

import { Route } from '@/routes/api/uploads.$slug'

const TOKEN = 'tildageode_ext_test'
const URL_ = 'https://tilda-geo.de/api/uploads/bewertung-rvn-app.geojson'

// The handlers are the route's own; no server is started.
const handlers = Route.options.server!.handlers as unknown as {
  GET: (ctx: { request: Request; params: { slug: string } }) => Promise<Response>
  OPTIONS: () => Response
}

function get(headers: Record<string, string> = {}) {
  return handlers.GET({
    request: new Request(URL_, { headers }),
    params: { slug: 'bewertung-rvn-app.geojson' },
  })
}
const withToken = (token = TOKEN) => ({ Authorization: `Bearer ${token}` })

function upload(overrides: { public?: boolean } = {}) {
  return {
    slug: 'bewertung-rvn-app',
    public: overrides.public ?? false,
    geojsonUrl: 'https://bucket.s3.example/bewertung-rvn-app.geojson',
    pmtilesUrl: null,
    externalSourceUrl: null,
    cacheTtlSeconds: null,
    regions: [{ id: 11 }, { id: 12 }],
  }
}

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
  for (const model of Object.values(db)) {
    for (const fn of Object.values(model)) fn.mockReset()
  }
  getAppSession.mockReset()
  proxyS3Url.mockReset()
  db.mapDatasetUpload.findFirst.mockResolvedValue(upload())
  db.externalApiToken.findUnique.mockResolvedValue(tokenRow())
  db.membership.count.mockResolvedValue(1)
  proxyS3Url.mockImplementation(
    async () =>
      new Response('{"type":"FeatureCollection","features":[]}', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600, must-revalidate',
          ETag: '"abc"',
        },
      }),
  )
  // A request with a token must never fall back to the cookie.
  getAppSession.mockImplementation(() => {
    throw new Error('cookie session must not be used')
  })
})

describe('GET /api/uploads/$slug with a Bearer token', () => {
  test('member of one of the regions gets the file; the answer is private', async () => {
    const response = await get(withToken())

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('FeatureCollection')
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache')
    expect(response.headers.get('Vary')).toContain('Authorization')
    expect(response.headers.get('ETag')).toBe('"abc"')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(db.membership.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', regionId: { in: [11, 12] } },
    })
    // Only the hash of the token is looked up.
    expect(db.externalApiToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hashedToken: createHash('sha256').update(TOKEN).digest('hex') },
      }),
    )
  })

  test('admin gets the file without a membership lookup', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ role: UserRoleEnum.ADMIN }))

    expect((await get(withToken())).status).toBe(200)
    expect(db.membership.count).not.toHaveBeenCalled()
  })

  test('non-member is 403 not_member and the file is not read', async () => {
    db.membership.count.mockResolvedValue(0)
    const response = await get(withToken())

    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('not_member')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(proxyS3Url).not.toHaveBeenCalled()
  })

  test('token of another scope (notes) is 401 invalid_token', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ scope: 'notes' }))
    const response = await get(withToken())

    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('invalid_token')
    expect(proxyS3Url).not.toHaveBeenCalled()
  })

  test('expired token is 401 token_expired', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    const response = await get(withToken())

    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('token_expired')
    expect(proxyS3Url).not.toHaveBeenCalled()
  })

  test('unknown token is 401 invalid_token', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(null)
    const response = await get(withToken('tildageode_ext_unknown'))

    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('invalid_token')
  })

  test('a token that is not a TILDA token (e.g. an OSM token) is 401 invalid_token', async () => {
    const response = await get(withToken('osm-access-token'))

    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('invalid_token')
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })
})

describe('GET /api/uploads/$slug without a Bearer token', () => {
  beforeEach(() => {
    getAppSession.mockReset()
  })

  test('public upload needs nothing and is not changed', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(upload({ public: true }))
    const response = await get()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate')
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('public upload ignores a Bearer token (even a bad one)', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(upload({ public: true }))
    const response = await get(withToken('garbage'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate')
  })

  test('private upload: guest is 401, cookie member passes, cookie answer is unchanged', async () => {
    getAppSession.mockResolvedValue(null)
    expect((await get()).status).toBe(401)
    expect(proxyS3Url).not.toHaveBeenCalled()

    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    const response = await get()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate')
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('private upload: cookie non-member is 403', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    db.membership.count.mockResolvedValue(0)

    expect((await get()).status).toBe(403)
  })
})

describe('OPTIONS /api/uploads/$slug', () => {
  test('preflight allows the Authorization header from any origin', () => {
    const response = handlers.OPTIONS()

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
  })
})
