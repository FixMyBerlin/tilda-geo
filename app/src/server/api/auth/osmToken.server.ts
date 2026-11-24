import { ExternalApiError } from '@/server/api/util/externalApiResponses.server'
import {
  EXTERNAL_API_DEFAULT_SCOPE,
  EXTERNAL_API_TOKEN_SCOPES,
} from '@/server/auth/externalApiToken.const'
import { createExternalApiToken } from '@/server/auth/externalApiTokens.server'
import {
  assertExternalAuthNotRateLimited,
  bearerToken,
  recordFailedExternalAuth,
} from '@/server/auth/externalSession.server'
import { fetchOsmUserDetails } from '@/server/auth/osmUserDetails.server'
import db from '@/server/db.server'
import { formatUserDisplayName } from '@/shared/userDisplayName'

function requestedScope(request: Request) {
  const scope = new URL(request.url).searchParams.get('scope') ?? EXTERNAL_API_DEFAULT_SCOPE
  const known = EXTERNAL_API_TOKEN_SCOPES.find((knownScope) => knownScope === scope)
  if (!known) {
    throw new ExternalApiError(400, 'invalid_input', 'Unknown scope', {
      allowed: EXTERNAL_API_TOKEN_SCOPES,
    })
  }
  return known
}

/**
 * Token exchange: the caller proves its OSM identity with an OSM OAuth2 access token and gets a
 * short-lived TILDA token for one scope (`?scope=notes` (default) or `?scope=uploads`). The OSM
 * token is only passed on to OSM to ask who it belongs to — it is never stored or logged. No user
 * is created here: the mapper has to sign in to TILDA once. See docs/External-API-Token.md.
 */
export async function exchangeOsmToken(request: Request) {
  assertExternalAuthNotRateLimited(request, 'exchange')
  const scope = requestedScope(request)

  const osmAccessToken = bearerToken(request)
  if (!osmAccessToken) {
    recordFailedExternalAuth(request, 'exchange')
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
      recordFailedExternalAuth(request, 'exchange')
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

  const { token, expiresAt } = await createExternalApiToken({ userId: user.id, scope })
  return {
    token,
    tokenType: 'Bearer',
    scope,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, osmId: user.osmId, name: formatUserDisplayName(user) ?? '' },
  }
}
