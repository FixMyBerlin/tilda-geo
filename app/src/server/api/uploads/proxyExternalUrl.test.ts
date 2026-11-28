import fs from 'node:fs'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'

// The proxy keeps its file cache below the working directory; the tests use their own.
const cwd = vi.hoisted(() => {
  const fsHoisted = process.getBuiltinModule('node:fs')
  const osHoisted = process.getBuiltinModule('node:os')
  const pathHoisted = process.getBuiltinModule('node:path')
  const dir = fsHoisted.mkdtempSync(pathHoisted.join(osHoisted.tmpdir(), 'proxy-external-url-'))
  const originalCwd = process.cwd
  process.cwd = () => dir
  return { dir, originalCwd }
})

import { proxyExternalUrl } from './proxyExternalUrl'

const GEOJSON = '{"type":"FeatureCollection","features":[]}'

afterAll(() => {
  vi.unstubAllGlobals()
  process.cwd = cwd.originalCwd
  fs.rmSync(cwd.dir, { recursive: true, force: true })
})

let slugCount = 0
let slug: string
const get = (method = 'GET', headers: Record<string, string> = {}) =>
  proxyExternalUrl(
    new Request('https://tilda-geo.de/api/uploads/x.geojson', { method, headers }),
    'https://example.com/x.geojson',
    3600,
    'geojson',
    slug,
  )

const fetchMock = vi.fn()
beforeEach(() => {
  slug = `external-${++slugCount}`
  fetchMock.mockReset()
  fetchMock.mockImplementation(
    async () =>
      new Response(GEOJSON, {
        headers: { ETag: '"source-1"', 'Last-Modified': 'Sun, 01 Nov 2026 10:00:00 GMT' },
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
})

describe('proxyExternalUrl: If-None-Match and HEAD', () => {
  test('first GET fetches the source and sends its ETag', async () => {
    const response = await get()

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(GEOJSON)
    expect(response.headers.get('ETag')).toBe('"source-1"')
  })

  test('a matching If-None-Match is 304 without a body, from the cache and on the first fetch', async () => {
    const onFirstFetch = await get('GET', { 'If-None-Match': '"source-1"' })
    expect(onFirstFetch.status).toBe(304)

    const fromCache = await get('GET', { 'If-None-Match': 'W/"source-1", "other"' })
    expect(fromCache.status).toBe(304)
    expect(fromCache.body).toBeNull()
    expect(fromCache.headers.get('ETag')).toBe('"source-1"')
    expect(fromCache.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate')
    expect(fromCache.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('another If-None-Match gets the file', async () => {
    await get()
    const response = await get('GET', { 'If-None-Match': '"older"' })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(GEOJSON)
  })

  test('a source without ETag never answers 304', async () => {
    fetchMock.mockImplementation(async () => new Response(GEOJSON))
    await get()
    const response = await get('GET', { 'If-None-Match': '"source-1"' })

    expect(response.status).toBe(200)
  })

  test('HEAD from the cache has the headers of the file and no body', async () => {
    await get()
    const response = await get('HEAD')

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(response.headers.get('ETag')).toBe('"source-1"')
    expect(response.headers.get('Last-Modified')).toBe('Sun, 01 Nov 2026 10:00:00 GMT')
    expect(response.headers.get('Content-Type')).toBe('application/geo+json')
    // A GET may send the GeoJSON compressed.
    expect(response.headers.get('Content-Length')).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('HEAD from the cache does not read the file', async () => {
    await get()
    const readFile = vi.spyOn(fs, 'readFileSync')
    try {
      await get('HEAD')
      const readsOfCachedFile = readFile.mock.calls.filter(([file]) =>
        String(file).endsWith('.geojson'),
      )
      expect(readsOfCachedFile).toHaveLength(0)
    } finally {
      readFile.mockRestore()
    }
  })
})
