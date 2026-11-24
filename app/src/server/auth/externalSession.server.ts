import { ExternalApiError } from '@/server/api/util/externalApiResponses.server'
import {
  failedAuthRetryAfterSeconds,
  getClientIp,
  isFailedAuthRateLimited,
  recordFailedAuth,
} from '@/server/api/util/failedAuthRateLimit.server'
import type { ExternalApiTokenScope } from '@/server/auth/externalApiToken.const'
import { verifyExternalApiToken } from '@/server/auth/externalApiTokens.server'

/**
 * What a request with an external API token (Bearer) needs, shared by the token exchange, the
 * notes API and the uploads route. See docs/External-API-Token.md.
 */

/** The token exchange has its own limiter bucket, so failed exchanges do not block the API calls. */
type RateLimitBucket = 'exchange' | 'session'

const rateLimitKey = (request: Request, bucket: RateLimitBucket) =>
  `external-${bucket}:${getClientIp(request)}`

export function assertExternalAuthNotRateLimited(request: Request, bucket: RateLimitBucket) {
  const key = rateLimitKey(request, bucket)
  if (isFailedAuthRateLimited(key)) {
    throw new ExternalApiError(
      429,
      'rate_limited',
      'Too many failed attempts, try again later',
      undefined,
      { 'Retry-After': String(failedAuthRetryAfterSeconds(key)) },
    )
  }
}

export function recordFailedExternalAuth(request: Request, bucket: RateLimitBucket) {
  recordFailedAuth(rateLimitKey(request, bucket))
}

/** The token of an `Authorization: Bearer` header; any other scheme (Basic, …) is no token. */
export function bearerToken(request: Request) {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

/** The session behind a TILDA external API token; throws 401 `invalid_token` / `token_expired`. */
export async function requireExternalSession(request: Request, scope: ExternalApiTokenScope) {
  assertExternalAuthNotRateLimited(request, 'session')

  const token = bearerToken(request)
  const verified = token ? await verifyExternalApiToken(token, scope) : null
  if (!verified?.ok) {
    // An expired token is the normal end of a session, not an attack.
    if (verified?.reason === 'expired') {
      throw new ExternalApiError(401, 'token_expired', 'Token expired, request a new session')
    }
    recordFailedExternalAuth(request, 'session')
    throw new ExternalApiError(
      401,
      token ? 'invalid_token' : 'missing_token',
      'Invalid or missing token',
    )
  }
  return { headers: request.headers, session: verified.session, tokenId: verified.tokenId }
}
