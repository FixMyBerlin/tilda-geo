import { afterEach, describe, expect, test, vi } from 'vitest'
import { fetchOsmTokenInfo } from './osmTokenInfo.server'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

afterEach(() => fetchMock.mockReset())

// The Doorkeeper shape (https://github.com/doorkeeper-gem/doorkeeper/wiki/API-endpoint-descriptions-and-examples).
const doorkeeperTokenInfo = {
  resource_owner_id: 123,
  scope: ['read_prefs', 'write_notes'],
  expires_in: null,
  application: { uid: 'client-id-of-the-app' },
  created_at: 1_700_000_000,
}

describe('fetchOsmTokenInfo', () => {
  test('Doorkeeper shape: OSM user id and client id of the app', async () => {
    fetchMock.mockResolvedValue(Response.json(doorkeeperTokenInfo))

    await expect(fetchOsmTokenInfo('osm-token')).resolves.toEqual({
      ok: true,
      osmId: 123,
      osmClientId: 'client-id-of-the-app',
    })
  })

  test('asks the OSM token info with the Bearer token, without redirects and with a timeout', async () => {
    fetchMock.mockResolvedValue(Response.json(doorkeeperTokenInfo))
    await fetchOsmTokenInfo('osm-token')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://www.openstreetmap.org/oauth2/token/info')
    expect(init.method).toBe('GET')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer osm-token' })
    expect(init.redirect).toBe('error')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  test('resource_owner_id null (a token without a user) is refused', async () => {
    fetchMock.mockResolvedValue(Response.json({ ...doorkeeperTokenInfo, resource_owner_id: null }))

    await expect(fetchOsmTokenInfo('osm-token')).resolves.toMatchObject({ ok: false })
  })

  test('a response without application is refused', async () => {
    fetchMock.mockResolvedValue(Response.json({ resource_owner_id: 123 }))

    await expect(fetchOsmTokenInfo('osm-token')).resolves.toMatchObject({ ok: false })
  })

  test('a response that is not JSON is refused', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Not JSON</html>', { status: 200 }))

    await expect(fetchOsmTokenInfo('osm-token')).resolves.toEqual({ ok: false, status: 502 })
  })

  test('401 from OSM is invalid, 5xx is passed on as it is', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    await expect(fetchOsmTokenInfo('osm-token')).resolves.toEqual({ ok: false, status: 401 })

    fetchMock.mockResolvedValue(new Response('', { status: 503 }))
    await expect(fetchOsmTokenInfo('osm-token')).resolves.toEqual({ ok: false, status: 503 })
  })

  test('a network error, a timeout or a redirect rejects', async () => {
    fetchMock.mockRejectedValue(new DOMException('timeout', 'TimeoutError'))

    await expect(fetchOsmTokenInfo('osm-token')).rejects.toThrow()
  })
})
