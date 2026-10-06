/** Prefix for external notes API Bearer tokens; the plaintext is only ever returned by the token exchange. */
export const EXTERNAL_API_TOKEN_PREFIX = 'tildageode_ext_' as const

/** What a token may be used for; stored in `ExternalApiToken.scope`. */
export type ExternalApiTokenScope = 'notes'

/** Short-lived on purpose: the client holds the OSM token and exchanges it again when ours expires. */
export const EXTERNAL_API_TOKEN_TTL_MS = 60 * 60 * 1000
