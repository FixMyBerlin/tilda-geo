import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const db = vi.hoisted(() => ({
  mapDatasetUpload: { findFirst: vi.fn() },
  externalApiToken: { findUnique: vi.fn(), update: vi.fn() },
  membership: { count: vi.fn() },
}))
const { getAppSession, proxyS3Url, proxyExternalUrl, handleCsvExport } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  proxyS3Url: vi.fn(),
  proxyExternalUrl: vi.fn(),
  handleCsvExport: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({ default: db }))
vi.mock('@/server/auth/session.server', () => ({ getAppSession, requireAdmin: vi.fn() }))
vi.mock('@/server/api/uploads/proxyS3Url.server', () => ({ proxyS3Url }))
vi.mock('@/server/api/uploads/proxyExternalUrl', () => ({ proxyExternalUrl }))
vi.mock('@/server/api/uploads/handleCsvExport', () => ({ handleCsvExport }))

import { Route } from '@/routes/api/uploads.$slug'
import { resetFailedAuthRateLimits } from '@/server/api/util/failedAuthRateLimit.server'

const TOKEN = 'tildageode_ext_test'
const URL_ = 'https://tilda-geo.de/api/uploads/my-dataset.geojson'

// The handlers are the route's own; no server is started.
const handlers = Route.options.server!.handlers as unknown as {
  GET: (ctx: { request: Request; params: { slug: string } }) => Promise<Response>
  OPTIONS: () => Response
}

// TanStack Start answers a HEAD request with the GET handler and drops the body.
function get(headers: Record<string, string> = {}, slug = 'my-dataset.geojson', method = 'GET') {
  return handlers.GET({
    request: new Request(URL_, { method, headers }),
    params: { slug },
  })
}
const withToken = (token = TOKEN) => ({ Authorization: `Bearer ${token}` })

function upload(
  overrides: {
    public?: boolean
    regions?: { id: number }[]
    externalSourceUrl?: string | null
    cacheTtlSeconds?: number | null
  } = {},
) {
  return {
    slug: 'my-dataset',
    public: overrides.public ?? false,
    geojsonUrl: 'https://bucket.s3.example/my-dataset.geojson',
    pmtilesUrl: null,
    externalSourceUrl: overrides.externalSourceUrl ?? null,
    cacheTtlSeconds: overrides.cacheTtlSeconds ?? null,
    regions: overrides.regions ?? [{ id: 11 }, { id: 12 }],
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
  proxyExternalUrl.mockReset()
  handleCsvExport.mockReset()
  resetFailedAuthRateLimits()
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
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(response.headers.get('Vary')).toBe('Authorization, Cookie')
    expect(response.headers.get('ETag')).toBe('"abc"')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(db.membership.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        regionId: { in: [11, 12] },
        region: { status: { not: 'DEACTIVATED' } },
      },
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

describe('GET /api/uploads/$slug with a Bearer token: files and statuses', () => {
  test('304 and 206 of the file proxy stay as they are and are private', async () => {
    proxyS3Url.mockResolvedValue(
      new Response(null, {
        status: 304,
        headers: { ETag: '"abc"', 'Access-Control-Allow-Origin': '*' },
      }),
    )
    const notModified = await get({ ...withToken(), 'If-None-Match': '"abc"' })
    expect(notModified.status).toBe(304)
    expect(notModified.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(notModified.headers.get('Vary')).toBe('Authorization, Cookie')

    proxyS3Url.mockResolvedValue(
      new Response('part', {
        status: 206,
        headers: { 'Content-Range': 'bytes 0-3/10', 'Cache-Control': 'public, max-age=3600' },
      }),
    )
    const partial = await get({ ...withToken(), Range: 'bytes=0-3' })
    expect(partial.status).toBe(206)
    expect(partial.headers.get('Content-Range')).toBe('bytes 0-3/10')
    expect(partial.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
  })

  test('HEAD with a token: same access check, private headers, proxy gets the HEAD request', async () => {
    const response = await get(withToken(), 'my-dataset.geojson', 'HEAD')

    expect(response.status).toBe(200)
    expect(response.headers.get('ETag')).toBe('"abc"')
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(response.headers.get('Vary')).toBe('Authorization, Cookie')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(proxyS3Url.mock.calls[0]?.[0].method).toBe('HEAD')
  })

  test('HEAD with a bad token or a non-member is refused like GET', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(null)
    const unknown = await get(withToken('tildageode_ext_unknown'), 'my-dataset.geojson', 'HEAD')
    expect(unknown.status).toBe(401)
    expect(unknown.headers.get('Access-Control-Expose-Headers')).toContain('Last-Modified')

    db.externalApiToken.findUnique.mockResolvedValue(tokenRow())
    db.membership.count.mockResolvedValue(0)
    expect((await get(withToken(), 'my-dataset.geojson', 'HEAD')).status).toBe(403)
    expect(proxyS3Url).not.toHaveBeenCalled()
  })

  test('CSV export with a token is private', async () => {
    handleCsvExport.mockResolvedValue(
      new Response('a;b', { headers: { 'Cache-Control': 'public, max-age=60' } }),
    )
    const response = await get(withToken(), 'my-dataset.csv')

    expect(response.status).toBe(200)
    expect(handleCsvExport).toHaveBeenCalled()
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
  })

  test('HEAD on .csv: same access check, the export gets the HEAD request and the answer is private', async () => {
    handleCsvExport.mockResolvedValue(new Response(null, { headers: { ETag: 'W/"abc-csv"' } }))
    const response = await get(withToken(), 'my-dataset.csv', 'HEAD')

    expect(response.status).toBe(200)
    expect(handleCsvExport.mock.calls[0]?.[0].method).toBe('HEAD')
    expect(response.headers.get('ETag')).toBe('W/"abc-csv"')
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')

    db.membership.count.mockResolvedValue(0)
    handleCsvExport.mockClear()
    expect((await get(withToken(), 'my-dataset.csv', 'HEAD')).status).toBe(403)
    expect(handleCsvExport).not.toHaveBeenCalled()
  })

  test('If-None-Match on .csv reaches the export, and its 304 is private', async () => {
    handleCsvExport.mockResolvedValue(new Response(null, { status: 304 }))
    const response = await get({ ...withToken(), 'If-None-Match': 'W/"abc-csv"' }, 'my-dataset.csv')

    expect(response.status).toBe(304)
    expect(handleCsvExport.mock.calls[0]?.[0].headers.get('If-None-Match')).toBe('W/"abc-csv"')
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
  })

  test('external source with a token is private', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(
      upload({ externalSourceUrl: 'https://example.com/data.geojson', cacheTtlSeconds: 3600 }),
    )
    proxyExternalUrl.mockResolvedValue(
      new Response('{}', { headers: { 'Cache-Control': 'public, max-age=3600, must-revalidate' } }),
    )
    const response = await get(withToken())

    expect(response.status).toBe(200)
    expect(proxyExternalUrl).toHaveBeenCalled()
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(response.headers.get('Vary')).toBe('Authorization, Cookie')
  })

  test('errors of the file itself are private, too: 400 format not available, 500 of the proxy', async () => {
    const wrongFormat = await get(withToken(), 'my-dataset.pmtiles')
    expect(wrongFormat.status).toBe(400)
    expect(wrongFormat.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(wrongFormat.headers.get('Vary')).toBe('Authorization, Cookie')
    expect(wrongFormat.headers.get('Access-Control-Allow-Origin')).toBe('*')

    proxyS3Url.mockResolvedValue(
      Response.json(
        { source: 'S3', statusText: 'boom' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
      ),
    )
    const failed = await get(withToken())
    expect(failed.status).toBe(500)
    expect(failed.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(failed.headers.get('Vary')).toBe('Authorization, Cookie')
  })

  test('a public upload keeps its own caching, also for the format error', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(upload({ public: true }))
    const response = await get({}, 'my-dataset.pmtiles')

    expect(response.status).toBe(400)
    expect(response.headers.get('Cache-Control')).not.toBe('private, max-age=3600, must-revalidate')
  })

  test('upload without regions is 403 for a member token and a cookie user, 200 for an admin', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(upload({ regions: [] }))
    expect((await get(withToken())).status).toBe(403)

    getAppSession.mockReset()
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    expect((await get()).status).toBe(403)

    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ role: UserRoleEnum.ADMIN }))
    expect((await get(withToken())).status).toBe(200)
  })

  describe('rate limit of failed attempts', () => {
    const fromIp = (ip: string, token = TOKEN) => ({
      ...withToken(token),
      'X-Forwarded-For': ip,
    })
    const failFromIp = async (ip: string, attempts = 20) => {
      db.externalApiToken.findUnique.mockResolvedValue(null)
      for (let attempt = 0; attempt < attempts; attempt++) {
        expect((await get(fromIp(ip, 'tildageode_ext_unknown'))).status).toBe(401)
      }
    }

    test('429 with Retry-After for a failed attempt after 20 failures; the file is not read', async () => {
      await failFromIp('203.0.113.5')

      const response = await get(fromIp('203.0.113.5', 'tildageode_ext_unknown'))
      expect(response.status).toBe(429)
      expect((await response.json()).error).toBe('rate_limited')
      expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0)
      expect(proxyS3Url).not.toHaveBeenCalled()
    })

    test('a valid token still works while its IP is limited (a bad client behind the same NAT)', async () => {
      await failFromIp('203.0.113.5')

      db.externalApiToken.findUnique.mockResolvedValue(tokenRow())
      expect((await get(fromIp('203.0.113.5'))).status).toBe(200)
    })

    test('another IP has its own bucket', async () => {
      await failFromIp('203.0.113.5')

      db.externalApiToken.findUnique.mockResolvedValue(null)
      expect((await get(fromIp('198.51.100.7', 'tildageode_ext_unknown'))).status).toBe(401)
    })

    test('without an IP header nothing is limited', async () => {
      db.externalApiToken.findUnique.mockResolvedValue(null)
      for (let attempt = 0; attempt < 30; attempt++) {
        expect((await get(withToken('tildageode_ext_unknown'))).status).toBe(401)
      }
    })
  })

  test('401 answers name the scheme', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(null)
    const response = await get(withToken('tildageode_ext_unknown'))

    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
  })
})

describe('GET /api/uploads/$slug without a Bearer token', () => {
  beforeEach(() => {
    getAppSession.mockReset()
  })

  test('public upload needs nothing and keeps its public caching', async () => {
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

  test('private upload: guest is 401 { statusText, message }, never cached; cookie member passes', async () => {
    getAppSession.mockResolvedValue(null)
    const denied = await get()
    expect(denied.status).toBe(401)
    expect(await denied.json()).toMatchObject({ statusText: 'Unauthorized' })
    expect(denied.headers.get('Cache-Control')).toBe('no-store')
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(proxyS3Url).not.toHaveBeenCalled()

    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    const response = await get()
    expect(response.status).toBe(200)
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('private upload: the cookie answer is private too, not public for 1 hour', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    const response = await get()

    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600, must-revalidate')
    expect(response.headers.get('Vary')).toBe('Authorization, Cookie')
    expect(response.headers.get('ETag')).toBe('"abc"')
  })

  test('private upload: cookie non-member is 403, never cached', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    db.membership.count.mockResolvedValue(0)
    const response = await get()

    expect(response.status).toBe(403)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  test('Authorization: Basic is no token: the cookie decides', async () => {
    getAppSession.mockResolvedValue(null)
    const denied = await get({ Authorization: 'Basic dXNlcjpwYXNz' })
    expect(denied.status).toBe(401)
    expect(await denied.json()).toMatchObject({ statusText: 'Unauthorized' })

    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    expect((await get({ Authorization: 'Basic dXNlcjpwYXNz' })).status).toBe(200)
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('a guest learns nothing about the formats of a private file: 401, not 400', async () => {
    getAppSession.mockResolvedValue(null)

    expect((await get({}, 'my-dataset.pmtiles')).status).toBe(401)
    expect((await get({}, 'my-dataset.csv')).status).toBe(401)
  })

  test('a member gets the format error (400) for a format the file does not have', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    const response = await get({}, 'my-dataset.pmtiles')

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ statusText: 'Format not available' })
  })

  test('a missing slug is 404', async () => {
    db.mapDatasetUpload.findFirst.mockResolvedValue(null)

    expect((await get({}, 'missing.geojson')).status).toBe(404)
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

  test('other answers expose the headers a browser app needs and do not repeat the preflight headers', async () => {
    db.membership.count.mockResolvedValue(0)
    const response = await get(withToken())

    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('ETag')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBeNull()
  })
})
