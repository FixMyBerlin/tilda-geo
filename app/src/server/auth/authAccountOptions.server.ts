import type { BetterAuthOptions } from 'better-auth'

/**
 * How Better Auth links and stores OAuth accounts (`Account` table).
 * Shared with the unit test so it checks the config the app actually uses.
 */
export const accountOptions = {
  accountLinking: {
    enabled: true,
    trustedProviders: ['osm'],
    allowDifferentEmails: true,
    // OSM uses placeholder emails and never sets emailVerified; default true would block
    // implicit Account creation after mapProfileToUser creates the User (see link-account.mjs).
    requireLocalEmailVerified: false,
  },
  // accessToken and refreshToken are stored encrypted with SESSION_SECRET_KEY (xchacha20-poly1305).
  // `auth.api.getAccessToken` decrypts them. Rotating SESSION_SECRET_KEY makes stored tokens unreadable.
  encryptOAuthTokens: true,
} satisfies BetterAuthOptions['account']

/**
 * Better Auth routes that would hand the decrypted OSM token to the browser. TILDA only uses the
 * token on the server (`auth.api.getAccessToken`, which these paths do not affect).
 */
export const disabledAccountPaths = ['/get-access-token', '/refresh-token'] satisfies NonNullable<
  BetterAuthOptions['disabledPaths']
>
