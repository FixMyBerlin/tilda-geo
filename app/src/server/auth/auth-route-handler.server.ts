import { setCookie } from '@tanstack/react-start/server'
import { parseSetCookieHeader } from 'better-auth/cookies'
import { auth } from './auth.server'

/**
 * Forwards request to Better Auth and applies its Set-Cookie headers via TanStack's setCookie
 * (avoids tanstackStartCookies in auth config to prevent client bundle leak).
 * See https://github.com/TanStack/router/issues/4022#issuecomment-3046465062
 */
export async function forwardAuthAndApplyCookies(request: Request) {
  const response = await auth.handler(request)
  const setCookieHeader = response.headers.getSetCookie().join(', ')
  if (!setCookieHeader) return response

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
      // setCookie can fail in some server component contexts
    }
  })
  return response
}
