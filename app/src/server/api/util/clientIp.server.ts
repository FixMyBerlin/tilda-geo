/**
 * Resolve the client IP from proxy headers — used for the admin-API auth rate limiter and for
 * AuditLog attribution.
 *
 * WHY NOT THE LEFTMOST `X-Forwarded-For`:
 * `X-Forwarded-For` is a comma-separated list that each proxy *appends to on the right* with the
 * peer IP it actually saw. A client can send its own `X-Forwarded-For`, so the **leftmost** entry is
 * attacker-controlled. Trusting it lets an attacker rotate a fake IP per request to (a) bypass the
 * per-IP rate limiter (every request lands in a fresh bucket, so the limit never trips) and
 * (b) forge `AuditLog.ipAddress`. We therefore take the **rightmost** entry — the value written by
 * the nearest trusted proxy, which the client cannot influence.
 *
 * ASSUMPTION: exactly one trusted reverse proxy sits in front of the app (the standard nginx setup;
 * the `x-real-ip` fallback below implies the same). If you add another hop in front (e.g. a CDN such
 * as Cloudflare ahead of nginx), the real client IP moves one position to the left — adjust the
 * offset from the right accordingly, or read that CDN's spoof-proof header instead
 * (e.g. `CF-Connecting-IP`, `Fly-Client-IP`).
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const nearestProxyHop = parts.at(-1)
    if (nearestProxyHop) return nearestProxyHop
  }
  // `X-Real-IP` is set by the trusted proxy (overwriting any client value) to the connecting peer.
  return headers.get('x-real-ip')
}
