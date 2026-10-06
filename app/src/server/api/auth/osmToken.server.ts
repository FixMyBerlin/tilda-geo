import {
  getClientIp,
  isAdminApiAuthRateLimited,
  recordFailedAdminApiAuth,
} from '@/server/api/admin/adminApiAuthRateLimit.server'
import { bearerToken, ExternalApiError } from '@/server/api/util/externalApiResponses.server'
import type { ExternalApiTokenScope } from '@/server/auth/externalApiToken.const'
import {
  createExternalApiToken,
  verifyExternalApiToken,
} from '@/server/auth/externalApiTokens.server'
import { fetchOsmUserDetails } from '@/server/auth/osmUserDetails.server'
import db from '@/server/db.server'
import { formatUserDisplayName } from '@/shared/userDisplayName'

// Failed attempts share the limiter of the admin API (per IP, in memory), in their own bucket.
const rateLimitKey = (request: Request) => `external:${getClientIp(request)}`

function assertNotRateLimited(request: Request) {
  if (isAdminApiAuthRateLimited(rateLimitKey(request))) {
    throw new ExternalApiError(429, 'rate_limited', 'Too many failed attempts, try again later')
  }
}

/**
 * Token exchange: the caller proves its OSM identity with an OSM OAuth2 access token and gets a
 * short-lived TILDA token for the notes endpoints. The OSM token is only passed on to OSM to ask
 * who it belongs to — it is never stored or logged. No user is created here: the mapper has to
 * sign in to TILDA once.
 */
export async function exchangeOsmToken(request: Request) {
  assertNotRateLimited(request)

  const osmAccessToken = bearerToken(request)
  if (!osmAccessToken) {
    recordFailedAdminApiAuth(rateLimitKey(request))
    throw new ExternalApiError(
      401,
      'missing_token',
      'Authorization: Bearer <OSM access token> required',
    )
  }

  const details = await fetchOsmUserDetails(osmAccessToken).catch(() => null)
  if (!details) {
    throw new ExternalApiError(502, 'osm_unavailable', 'Could not reach OpenStreetMap')
  }
  if (!details.ok) {
    if (details.status === 401 || details.status === 403) {
      recordFailedAdminApiAuth(rateLimitKey(request))
      throw new ExternalApiError(
        401,
        'invalid_osm_token',
        'OpenStreetMap rejected the access token (it needs the read_prefs scope)',
      )
    }
    throw new ExternalApiError(502, 'osm_unavailable', 'OpenStreetMap could not verify the token')
  }

  const user = await db.user.findUnique({
    where: { osmId: details.user.osmId },
    select: { id: true, osmId: true, osmName: true, firstName: true, lastName: true },
  })
  if (!user) {
    throw new ExternalApiError(
      403,
      'no_tilda_user',
      'This OpenStreetMap account has no TILDA account yet. Sign in to TILDA once.',
    )
  }

  const scope = 'notes' satisfies ExternalApiTokenScope
  const { token, expiresAt } = await createExternalApiToken({ userId: user.id, scope })
  return {
    token,
    tokenType: 'Bearer',
    scope,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, osmId: user.osmId, name: formatUserDisplayName(user) ?? '' },
  }
}

/** The session behind a TILDA external API token; throws 401 `invalid_token` / `token_expired`. */
export async function requireExternalSession(request: Request, scope: ExternalApiTokenScope) {
  assertNotRateLimited(request)

  const token = bearerToken(request)
  const verified = token ? await verifyExternalApiToken(token, scope) : null
  if (!verified?.ok) {
    // An expired token is the normal end of a session, not an attack.
    if (verified?.reason === 'expired') {
      throw new ExternalApiError(401, 'token_expired', 'Token expired, request a new session')
    }
    recordFailedAdminApiAuth(rateLimitKey(request))
    throw new ExternalApiError(
      401,
      token ? 'invalid_token' : 'missing_token',
      'Invalid or missing token',
    )
  }
  return { headers: request.headers, session: verified.session, tokenId: verified.tokenId }
}
