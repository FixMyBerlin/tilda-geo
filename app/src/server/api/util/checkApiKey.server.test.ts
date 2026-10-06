import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { checkApiKey, compareApiKeyTimingSafe } from './checkApiKey.server'

const KEY = 'test-atlas-api-key'

beforeEach(() => {
  vi.stubEnv('ATLAS_API_KEY', KEY)
  vi.stubEnv('NODE_ENV', 'production')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ATLAS_API_KEY replaces the member/admin check on some API routes (see docs/Permissions.md).
describe('checkApiKey', () => {
  test.each([
    ['missing', 'https://tilda-geo.de/api/regions'],
    ['wrong', 'https://tilda-geo.de/api/regions?apiKey=nope'],
    ['prefix of the key', `https://tilda-geo.de/api/regions?apiKey=${KEY.slice(0, -1)}`],
  ])('%s key is rejected with 401', (_, url) => {
    const result = checkApiKey(new Request(url))
    expect(result.ok).toBe(false)
    expect(result.errorResponse?.status).toBe(401)
  })

  test('correct key passes (query param and body)', () => {
    expect(checkApiKey(new Request(`https://tilda-geo.de/api/regions?apiKey=${KEY}`)).ok).toBe(true)
    expect(checkApiKey({ apiKey: KEY }).ok).toBe(true)
  })

  test('no configured key rejects everything', () => {
    vi.stubEnv('ATLAS_API_KEY', '')
    expect(compareApiKeyTimingSafe('')).toBe(false)
    expect(compareApiKeyTimingSafe(KEY)).toBe(false)
  })

  test('development skips the check (never set NODE_ENV=development on a deployment)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(checkApiKey(new Request('https://localhost/api/regions')).ok).toBe(true)
  })
})
