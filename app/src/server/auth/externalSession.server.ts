import { ExternalApiError } from '@/server/api/util/externalApiResponses.server'
import {
  failedAuthRateLimitKey,
  failedAuthRetryAfterSeconds,
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

function rateLimitKey(request: Request, bucket: RateLimitBucket) {
  return failedAuthRateLimitKey(request, `external-${bucket}`)
}

function rateLimitedError(key: string) {
  return new ExternalApiError(
    429,
    'rate_limited',
    'Too many failed attempts, try again later',
    undefined,
    { 'Retry-After': String(failedAuthRetryAfterSeconds(key)) },
  )
}

/** For a request without a client IP header the limit is off (`failedAuthRateLimitKey`). */
export function assertExternalAuthNotRateLimited(request: Request, bucket: RateLimitBucket) {
  const key = rateLimitKey(request, bucket)
  if (key && isFailedAuthRateLimited(key)) throw rateLimitedError(key)
}

export function recordFailedExternalAuth(request: Request, bucket: RateLimitBucket) {
  const key = rateLimitKey(request, bucket)
  if (key) recordFailedAuth(key)
}

/** The token of an `Authorization: Bearer` header; any other scheme (Basic, …) is no token. */
export function bearerToken(request: Request) {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

/**
 * The session behind a TILDA external API token; throws 401 `invalid_token` / `token_expired`.
 * The token is verified first: a valid token works even when the IP is limited (a bad client
 * behind the same NAT must not lock out the others); only failures are refused with 429.
 */
export async function requireExternalSession(request: Request, scope: ExternalApiTokenScope) {
  const token = bearerToken(request)
  const verified = token ? await verifyExternalApiToken(token, scope) : null
  if (verified?.ok) {
    return { headers: request.headers, session: verified.session, tokenId: verified.tokenId }
  }

  // An expired token is the normal end of a session, not an attack.
  if (verified?.reason === 'expired') {
    throw new ExternalApiError(401, 'token_expired', 'Token expired, request a new session')
  }
  assertExternalAuthNotRateLimited(request, 'session')
  recordFailedExternalAuth(request, 'session')
  throw new ExternalApiError(
    401,
    token ? 'invalid_token' : 'missing_token',
    'Invalid or missing token',
  )
}
