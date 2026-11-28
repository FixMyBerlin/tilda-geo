import { ExternalApiError } from '@/server/api/util/externalApiResponses.server'
import {
  EXTERNAL_API_OSM_APPS,
  EXTERNAL_API_TOKEN_SCOPES,
} from '@/server/auth/externalApiToken.const'
import { createExternalApiToken } from '@/server/auth/externalApiTokens.server'
import {
  assertExternalAuthNotRateLimited,
  bearerToken,
  recordFailedExternalAuth,
} from '@/server/auth/externalSession.server'
import { fetchOsmTokenInfo } from '@/server/auth/osmTokenInfo.server'
import db from '@/server/db.server'
import { formatUserDisplayName } from '@/shared/userDisplayName'

function requestedScope(request: Request) {
  const scope = new URL(request.url).searchParams.get('scope')
  const known = EXTERNAL_API_TOKEN_SCOPES.find((knownScope) => knownScope === scope)
  if (!known) {
    throw new ExternalApiError(
      400,
      'invalid_input',
      scope === null ? 'Query parameter scope is required' : 'Unknown scope',
      { allowed: EXTERNAL_API_TOKEN_SCOPES },
    )
  }
  return known
}

/**
 * Token exchange: the caller proves its OSM identity with an OSM OAuth2 access token and gets a
 * short-lived TILDA token for one scope (`?scope=notes` or `?scope=uploads`, required). OSM tells
 * us who the token belongs to and which OSM application it was issued to; only the applications
 * in `EXTERNAL_API_OSM_APPS`, and only for their scopes, get a token. The OSM token is only passed
 * on to OSM — it is never stored or logged. No user is created here: the mapper has to sign in to
 * TILDA once. See docs/External-API-Token.md.
 */
export async function exchangeOsmToken(request: Request) {
  // A web page can still lock the exchange for its visitor's IP with bad tokens for a minute;
  // accepted, tokens that were issued keep working.
  assertExternalAuthNotRateLimited(request, 'exchange')
  const scope = requestedScope(request)

  // Not counted as failed: it costs no question to OSM, and any web page can send such a request.
  const osmAccessToken = bearerToken(request)
  if (!osmAccessToken) {
    throw new ExternalApiError(
      401,
      'missing_token',
      'Authorization: Bearer <OSM access token> required',
    )
  }

  // Every attempt that ends in `osm_unavailable` counts as failed, too: if OSM throttles or fails
  // us, a flood of invalid tokens must not keep looping against OSM.
  const tokenInfo = await fetchOsmTokenInfo(osmAccessToken).catch(() => null)
  if (!tokenInfo) {
    recordFailedExternalAuth(request, 'exchange')
    throw new ExternalApiError(502, 'osm_unavailable', 'Could not reach OpenStreetMap')
  }
  if (!tokenInfo.ok) {
    if (tokenInfo.status === 401 || tokenInfo.status === 403) {
      recordFailedExternalAuth(request, 'exchange')
      throw new ExternalApiError(
        401,
        'invalid_osm_token',
        'OpenStreetMap rejected the access token (invalid, expired or revoked)',
      )
    }
    recordFailedExternalAuth(request, 'exchange')
    throw new ExternalApiError(502, 'osm_unavailable', 'OpenStreetMap could not verify the token')
  }

  const app = EXTERNAL_API_OSM_APPS.find(({ osmClientId }) => osmClientId === tokenInfo.osmClientId)
  if (!app?.scopes.includes(scope)) {
    recordFailedExternalAuth(request, 'exchange')
    throw new ExternalApiError(
      403,
      'app_not_allowed',
      'This OpenStreetMap application is not allowed to use this scope',
    )
  }

  const user = await db.user.findUnique({
    where: { osmId: tokenInfo.osmId },
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
  // Which app got which access for whom; never the token.
  console.info(`External API: token issued, app ${app.name}, scope ${scope}, user ${user.id}`)
  return {
    token,
    tokenType: 'Bearer',
    scope,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, osmId: user.osmId, name: formatUserDisplayName(user) ?? '' },
  }
}
