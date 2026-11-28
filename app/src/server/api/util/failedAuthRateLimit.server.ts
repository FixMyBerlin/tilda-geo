/**
 * In-memory rate limiter for failed Bearer auth attempts of the token APIs (admin API, external
 * notes and uploads API, token exchange).
 *
 * Counts only auth failures (missing or invalid token), not successful requests. Window: 60s,
 * max 20 failures per key. A limited key receives 429 with `Retry-After`; each failure calls
 * `recordFailedAuth`. Every API builds its own key (prefix + client IP) with
 * `failedAuthRateLimitKey`, so one API's failures do not lock out another. A request without a
 * client IP has no key (`null`) and is not limited at all: one shared bucket for everybody would
 * let a single client lock out all.
 *
 * IPs come from `getClientIp` (rightmost forwarded hop; see `clientIpFromHeaders`).
 * State is a process-local Map, not shared across instances. It only slows down clients that keep
 * sending bad tokens, on a single node. Prunes expired entries when the map grows past 500 keys.
 */
import { clientIpFromHeaders } from '@/server/api/util/clientIp.server'

const WINDOW_MS = 60_000
const MAX_FAILED_ATTEMPTS = 20

type RateLimitEntry = { count: number; windowStart: number }

const failedAttemptsByKey = new Map<string, RateLimitEntry>()

/** The client IP for the audit log; `unknown` without a proxy header. The limiter uses `failedAuthRateLimitKey`. */
export function getClientIp(request: Request) {
  // Rightmost forwarded hop, NOT the client-spoofable leftmost — see clientIpFromHeaders.
  return clientIpFromHeaders(request.headers) ?? 'unknown'
}

let warnedAboutMissingClientIp = false

/**
 * The limiter key of a request (`<prefix>:<client IP>`), or `null` when the request has no client
 * IP header, which means no limiting for this request. Logs a warning once per process, because
 * it means the reverse proxy does not pass the IP (docs/External-API-Token.md#rate-limit).
 */
export function failedAuthRateLimitKey(request: Request, prefix: string) {
  const ip = clientIpFromHeaders(request.headers)
  if (ip) return `${prefix}:${ip}`
  if (!warnedAboutMissingClientIp) {
    warnedAboutMissingClientIp = true
    console.warn(
      'Rate limit of failed auth attempts is off for requests without X-Forwarded-For / X-Real-IP header',
    )
  }
  return null
}

function pruneExpiredEntries(now: number) {
  if (failedAttemptsByKey.size < 500) return
  for (const [key, entry] of failedAttemptsByKey) {
    if (now - entry.windowStart > WINDOW_MS) failedAttemptsByKey.delete(key)
  }
}

export function isFailedAuthRateLimited(key: string) {
  const now = Date.now()
  const entry = failedAttemptsByKey.get(key)
  if (!entry || now - entry.windowStart > WINDOW_MS) return false
  return entry.count >= MAX_FAILED_ATTEMPTS
}

/** Seconds until the window of a limited key ends (for `Retry-After`). */
export function failedAuthRetryAfterSeconds(key: string) {
  const entry = failedAttemptsByKey.get(key)
  if (!entry) return 1
  return Math.max(1, Math.ceil((entry.windowStart + WINDOW_MS - Date.now()) / 1000))
}

export function recordFailedAuth(key: string) {
  const now = Date.now()
  pruneExpiredEntries(now)
  const entry = failedAttemptsByKey.get(key)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    failedAttemptsByKey.set(key, { count: 1, windowStart: now })
    return
  }
  entry.count += 1
}

/** For tests: forget all failures so tests do not depend on their order. */
export function resetFailedAuthRateLimits() {
  failedAttemptsByKey.clear()
  warnedAboutMissingClientIp = false
}
