import { setCookie } from '@tanstack/react-start/server'
import { parseSetCookieHeader } from 'better-auth/cookies'

/**
 * Applies Set-Cookie headers from a Better Auth handler response via TanStack setCookie.
 * Needed when auth.handler runs inside another API route that returns its own Response
 * (e.g. /api/sign-in/osm). tanstackStartCookies reads ctx.context.responseHeaders and
 * does not cover this path; /api/auth/$ returns auth.handler directly and does not need this.
 *
 * FYI: Better Auth's own tanstackStartCookies passes the parsed value through unchanged,
 * whereas we decodeURIComponent it. setCookie re-encodes on write, so the value round-trips
 * to the same wire form (verified against the signed `state` cookie).
 */
export function applyAuthResponseCookies(authResponse: Response) {
  for (const setCookieHeader of authResponse.headers.getSetCookie()) {
    const parsed = parseSetCookieHeader(setCookieHeader)
    parsed.forEach((value, key) => {
      if (!key) return
      try {
        setCookie(key, decodeURIComponent(value.value), {
          sameSite: value.samesite,
          secure: value.secure,
          maxAge: value['max-age'],
          httpOnly: value.httponly,
          domain: value.domain,
          path: value.path,
        })
      } catch {
        // Swallow per-cookie failures so one bad cookie does not drop the rest:
        // decodeURIComponent throws on malformed values, and setCookie throws when
        // there is no active request context (e.g. some server-component paths).
      }
    })
  }
}
