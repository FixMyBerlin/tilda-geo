/** Prefix for external API Bearer tokens (notes, uploads); the plaintext is only ever returned by the token exchange. */
export const EXTERNAL_API_TOKEN_PREFIX = 'tildageode_ext_' as const

/** What a token may be used for; stored in `ExternalApiToken.scope`. A token works for exactly one scope. */
export const EXTERNAL_API_TOKEN_SCOPES = ['notes', 'uploads'] as const
export type ExternalApiTokenScope = (typeof EXTERNAL_API_TOKEN_SCOPES)[number]

/** The scope the token exchange issues when the caller asks for none. */
export const EXTERNAL_API_DEFAULT_SCOPE = 'notes' satisfies ExternalApiTokenScope

/** Short-lived on purpose: the client holds the OSM token and exchanges it again when ours expires. */
export const EXTERNAL_API_TOKEN_TTL_MS = 60 * 60 * 1000

/**
 * Expired tokens stay in the table this long, so a client that comes back after a break still
 * gets `token_expired` (renew the session) and not `invalid_token` (an attack, counted by the
 * rate limit). Rows older than that are deleted when a new token is issued.
 */
export const EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS = 24 * 60 * 60 * 1000
