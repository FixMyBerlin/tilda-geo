import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'

/**
 * Same rule as Better Auth's `isLikelyEncrypted` (better-auth/dist/oauth2/utils.mjs): only values that
 * match it get decrypted on read, everything else is passed through as a plain token.
 * OSM access tokens are 43 characters of base64url, so a plain one never matches.
 */
export function looksEncrypted(token: string) {
  if (token.startsWith('$ba$')) return true
  return token.length % 2 === 0 && /^[0-9a-f]+$/i.test(token)
}

type PlannedToken = {
  state: 'empty' | 'plain' | 'encrypted' | 'unreadable'
  encrypted: string | null
}

async function planToken(token: string | null, secret: string) {
  if (!token) return { state: 'empty', encrypted: null } satisfies PlannedToken
  if (looksEncrypted(token)) {
    try {
      await symmetricDecrypt({ key: secret, data: token })
      return { state: 'encrypted', encrypted: null } satisfies PlannedToken
    } catch {
      // Encrypted with another secret (or not a token at all). Never overwrite it.
      return { state: 'unreadable', encrypted: null } satisfies PlannedToken
    }
  }
  const encrypted = await symmetricEncrypt({ key: secret, data: token })
  if ((await symmetricDecrypt({ key: secret, data: encrypted })) !== token) {
    throw new Error('Encrypted token does not decrypt to the original value')
  }
  return { state: 'plain', encrypted } satisfies PlannedToken
}

export type AccountTokens = {
  id: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
}

/** What has to change on one `Account` row: encrypt plain tokens, drop the idToken. */
export async function planAccountTokens(account: AccountTokens, secret: string) {
  const access = await planToken(account.accessToken, secret)
  const refresh = await planToken(account.refreshToken, secret)
  const data: { accessToken?: string; refreshToken?: string; idToken?: null } = {}
  if (access.encrypted) data.accessToken = access.encrypted
  if (refresh.encrypted) data.refreshToken = refresh.encrypted
  if (account.idToken !== null) data.idToken = null
  return {
    id: account.id,
    accessToken: access.state,
    refreshToken: refresh.state,
    unreadable: access.state === 'unreadable' || refresh.state === 'unreadable',
    data,
  }
}
