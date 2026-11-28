/** Prefix for external API Bearer tokens (notes, uploads); the plaintext is only ever returned by the token exchange. */
export const EXTERNAL_API_TOKEN_PREFIX = 'tildageode_ext_' as const

/** What a token may be used for; stored in `ExternalApiToken.scope`. A token works for exactly one scope. */
export const EXTERNAL_API_TOKEN_SCOPES = ['notes', 'uploads'] as const
export type ExternalApiTokenScope = (typeof EXTERNAL_API_TOKEN_SCOPES)[number]

type ExternalApiOsmApp = {
  /** For people and logs only. */
  name: string
  /** `application.uid` of the OSM token info = the OSM OAuth2 application's client id. Public, not a secret. */
  osmClientId: string
  /** Scopes this app may ask the token exchange for. */
  scopes: readonly ExternalApiTokenScope[]
}

/**
 * The OSM OAuth2 applications whose users may exchange their OSM access token for a TILDA token.
 * Whoever holds a user's OSM token could otherwise ask for a TILDA token, so the exchange checks
 * with OSM which application the token was issued to.
 *
 * An app on this list reads everything its scope gives the signed-in user in TILDA (for `uploads`
 * all private files of their regions), not single datasets. Only apps of FixMyCity go here.
 * Adding an app is a code change; see docs/External-API-Token.md.
 */
export const EXTERNAL_API_OSM_APPS: readonly ExternalApiOsmApp[] = [
  {
    // FixMyCity apps for infraVelo (Netzanpassungen, Knotenpunkte, Fortschritt, Bewertung) and the iD editor
    name: 'infravelo-apps',
    osmClientId: 'mV4q3_OPMrW4kCfnPON30BRxAoKZPX0ZLxh8EjmHP-o',
    scopes: ['notes', 'uploads'],
  },
]

/** Short-lived on purpose: the client holds the OSM token and exchanges it again when ours expires. */
export const EXTERNAL_API_TOKEN_TTL_MS = 60 * 60 * 1000

/**
 * Expired tokens stay in the table this long, so a client that comes back after a break still
 * gets `token_expired` (renew the session) and not `invalid_token` (an attack, counted by the
 * rate limit). Rows older than that are deleted when a new token is issued.
 */
export const EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS = 24 * 60 * 60 * 1000
