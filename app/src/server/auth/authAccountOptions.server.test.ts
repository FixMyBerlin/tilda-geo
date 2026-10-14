import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { genericOAuth } from 'better-auth/plugins/generic-oauth'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountOptions, disabledAccountPaths } from './authAccountOptions.server'

const ORIGIN = 'http://localhost:3000'
const TOKEN_URL = 'https://osm.test/oauth2/token'
// Shape of a real OSM access token: 43 characters of base64url.
const OSM_ACCESS_TOKEN = 'Ab3_dEf-Gh1jKlMnOpQrStUvWxYz0123456789AbCdE'

type Row = Record<string, unknown>

function createTestAuth() {
  const memory = {
    user: [] as Row[],
    session: [] as Row[],
    account: [] as Row[],
    verification: [] as Row[],
  }
  const auth = betterAuth({
    database: memoryAdapter(memory),
    baseURL: ORIGIN,
    secret: 'test-secret-with-at-least-32-characters',
    account: accountOptions,
    disabledPaths: disabledAccountPaths,
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: 'osm',
            clientId: 'client-id',
            clientSecret: 'client-secret',
            authorizationUrl: 'https://osm.test/oauth2/authorize',
            tokenUrl: TOKEN_URL,
            scopes: ['read_prefs', 'write_notes'],
            getUserInfo: async () => ({
              id: '4711',
              name: 'mapper',
              email: 'osm-4711@example.com',
              emailVerified: false,
            }),
          },
        ],
      }),
    ],
  })
  return { auth, memory }
}

function storedAccount(memory: ReturnType<typeof createTestAuth>['memory']) {
  expect(memory.account).toHaveLength(1)
  const [account] = memory.account
  if (!account) throw new Error('No account stored')
  return account
}

const cookieHeader = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')

/**
 * Run the OSM sign-in: start the flow, then call the callback with a mocked token endpoint.
 * Returns the session cookie of the signed-in user.
 */
async function signInWithOsm(auth: ReturnType<typeof createTestAuth>['auth']) {
  const start = await auth.api.signInWithOAuth2({
    body: { providerId: 'osm', callbackURL: '/' },
    asResponse: true,
  })
  const { url } = (await start.json()) as { url: string }
  const state = new URL(url).searchParams.get('state')

  const realFetch = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const href = input instanceof Request ? input.url : String(input)
    if (href !== TOKEN_URL) return realFetch(input, init)
    return Response.json({
      access_token: OSM_ACCESS_TOKEN,
      token_type: 'Bearer',
      scope: 'read_prefs write_notes',
    })
  })

  const callback = await auth.handler(
    new Request(`${ORIGIN}/api/auth/oauth2/callback/osm?code=code&state=${state}`, {
      headers: { cookie: cookieHeader(start) },
    }),
  )
  expect(callback.status).toBe(302)
  expect(callback.headers.get('location')).not.toContain('error')
  return cookieHeader(callback)
}

describe('OSM OAuth token storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores the access token encrypted and getAccessToken returns it plain', async () => {
    const { auth, memory } = createTestAuth()
    await signInWithOsm(auth)

    const account = storedAccount(memory)
    expect(account.accessToken).not.toBe(OSM_ACCESS_TOKEN)
    expect(account.accessToken).toMatch(/^[0-9a-f]+$/)

    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: 'osm', userId: String(account.userId) },
    })
    expect(accessToken).toBe(OSM_ACCESS_TOKEN)
  })

  it('encrypts a plain token from before the change when the user signs in again', async () => {
    const { auth, memory } = createTestAuth()
    await signInWithOsm(auth)
    vi.restoreAllMocks()
    storedAccount(memory).accessToken = OSM_ACCESS_TOKEN

    await signInWithOsm(auth)

    expect(storedAccount(memory).accessToken).toMatch(/^[0-9a-f]+$/)
  })

  it('still reads plain tokens stored before encryption was switched on', async () => {
    const { auth, memory } = createTestAuth()
    await signInWithOsm(auth)
    const account = storedAccount(memory)
    account.accessToken = OSM_ACCESS_TOKEN

    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: 'osm', userId: String(account.userId) },
    })
    expect(accessToken).toBe(OSM_ACCESS_TOKEN)
  })

  it('never returns the token over HTTP, even to the signed-in user', async () => {
    const { auth } = createTestAuth()
    const cookie = await signInWithOsm(auth)

    // The cookie is a valid session: another route accepts it.
    const session = await auth.handler(
      new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie } }),
    )
    expect(session.status).toBe(200)

    for (const path of disabledAccountPaths) {
      const response = await auth.handler(
        new Request(`${ORIGIN}/api/auth${path}`, {
          method: 'POST',
          headers: { cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ providerId: 'osm' }),
        }),
      )
      expect(response.status, path).toBe(404)
      expect(await response.text()).not.toContain(OSM_ACCESS_TOKEN)
    }
  })
})
