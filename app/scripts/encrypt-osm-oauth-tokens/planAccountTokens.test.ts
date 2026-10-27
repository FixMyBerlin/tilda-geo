import { symmetricDecrypt } from 'better-auth/crypto'
import { describe, expect, it } from 'vitest'
import { looksEncrypted, planAccountTokens } from './planAccountTokens'

const SECRET = 'test-secret-with-at-least-32-characters'
const OSM_ACCESS_TOKEN = 'Ab3_dEf-Gh1jKlMnOpQrStUvWxYz0123456789AbCdE'

const account = (tokens: Partial<Parameters<typeof planAccountTokens>[0]>) => ({
  id: 'account-1',
  accessToken: null,
  refreshToken: null,
  idToken: null,
  ...tokens,
})

describe('planAccountTokens', () => {
  it('never treats an OSM access token as encrypted', () => {
    expect(OSM_ACCESS_TOKEN).toHaveLength(43)
    expect(looksEncrypted(OSM_ACCESS_TOKEN)).toBe(false)
  })

  it('encrypts a plain token so Better Auth can decrypt it', async () => {
    const plan = await planAccountTokens(account({ accessToken: OSM_ACCESS_TOKEN }), SECRET)

    expect(plan.accessToken).toBe('plain')
    expect(plan.refreshToken).toBe('empty')
    const encrypted = plan.data.accessToken ?? ''
    expect(looksEncrypted(encrypted)).toBe(true)
    expect(await symmetricDecrypt({ key: SECRET, data: encrypted })).toBe(OSM_ACCESS_TOKEN)
    expect(plan.data).not.toHaveProperty('idToken')
  })

  it('is idempotent', async () => {
    const first = await planAccountTokens(account({ accessToken: OSM_ACCESS_TOKEN }), SECRET)
    const second = await planAccountTokens(account({ accessToken: first.data.accessToken }), SECRET)

    expect(second.accessToken).toBe('encrypted')
    expect(second.data).toEqual({})
  })

  it('drops a stored idToken', async () => {
    const plan = await planAccountTokens(account({ idToken: 'stored-id-token' }), SECRET)
    expect(plan.data).toEqual({ idToken: null })
  })

  it('flags tokens encrypted with another secret and leaves them alone', async () => {
    const other = await planAccountTokens(
      account({ accessToken: OSM_ACCESS_TOKEN }),
      `${SECRET}-old`,
    )
    const plan = await planAccountTokens(account({ accessToken: other.data.accessToken }), SECRET)

    expect(plan.unreadable).toBe(true)
    expect(plan.data).toEqual({})
  })
})
