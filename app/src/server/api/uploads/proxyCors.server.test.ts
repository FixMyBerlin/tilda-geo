import { afterEach, describe, expect, test, vi } from 'vitest'

const send = vi.hoisted(() => vi.fn())
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = send
  },
  GetObjectCommand: class {},
  HeadObjectCommand: class {
    constructor(readonly input: unknown) {}
  },
}))

import { proxyExternalUrl } from './proxyExternalUrl'
import { proxyS3Url } from './proxyS3Url.server'

afterEach(() => {
  send.mockReset()
  vi.unstubAllGlobals()
})

function expectCors(response: Response) {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  expect(response.headers.get('Access-Control-Expose-Headers')).toContain('ETag')
  // Only the preflight names the allowed request headers.
  expect(response.headers.get('Access-Control-Allow-Headers')).toBeNull()
}

describe('proxies answer with CORS headers, also on errors', () => {
  const request = new Request('https://tilda-geo.de/api/uploads/x.geojson')

  test('S3: error, 304 and file', async () => {
    send.mockRejectedValueOnce(
      Object.assign(new Error('boom'), { $metadata: { httpStatusCode: 500 } }),
    )
    const failed = await proxyS3Url(request, 'https://bucket.s3.example/x.pmtiles')
    expect(failed.status).toBe(500)
    expectCors(failed)

    send.mockRejectedValueOnce(
      Object.assign(new Error('nm'), { $metadata: { httpStatusCode: 304 } }),
    )
    const notModified = await proxyS3Url(request, 'https://bucket.s3.example/x.pmtiles')
    expect(notModified.status).toBe(304)
    expectCors(notModified)

    send.mockResolvedValueOnce({
      Body: Object.assign(new Uint8Array([1, 2]), { statusCode: 200 }),
      ContentLength: 2,
      ContentType: 'application/x-protobuf',
      ETag: '"abc"',
    })
    const file = await proxyS3Url(request, 'https://bucket.s3.example/x.pmtiles')
    expect(file.status).toBe(200)
    expectCors(file)
  })

  test('S3 HEAD: only the metadata is asked for, no body, headers to check for a new version', async () => {
    send.mockResolvedValueOnce({
      ContentLength: 2,
      ContentType: 'application/x-protobuf',
      ETag: '"abc"',
      LastModified: new Date('2026-11-01T10:00:00Z'),
    })
    const response = await proxyS3Url(
      new Request('https://tilda-geo.de/api/uploads/x.pmtiles', {
        method: 'HEAD',
        headers: { 'If-None-Match': '"old"' },
      }),
      'https://bucket.s3.example/x.pmtiles',
    )

    expect(send.mock.calls[0]?.[0].input).toMatchObject({ IfNoneMatch: '"old"' })
    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(response.headers.get('ETag')).toBe('"abc"')
    expect(response.headers.get('Last-Modified')).toBe('Sun, 01 Nov 2026 10:00:00 GMT')
    expect(response.headers.get('Content-Length')).toBe('2')
    expectCors(response)
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Last-Modified')
  })

  test('external: fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const response = await proxyExternalUrl(
      request,
      'https://example.com/x.geojson',
      60,
      'geojson',
      'proxy-cors-test-failing-fetch',
    )

    expect(response.status).toBe(500)
    expectCors(response)
  })

  test('external: error status of the source', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 404 })))
    const response = await proxyExternalUrl(
      request,
      'https://example.com/x.geojson',
      60,
      'geojson',
      'proxy-cors-test-not-found',
    )

    expect(response.status).toBe(404)
    expectCors(response)
  })
})
