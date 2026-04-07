import { deleteCookie, getCookie, getRequestURL, type H3Event, parseCookies, setCookie } from 'h3'
import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  // ---------------------------------------------------------------------------
  // One-time removal of pre–Better Auth cookies (atlas_*, next-auth.*).
  // Remove this plugin from vite.config.ts and delete this file when done.
  // ---------------------------------------------------------------------------
  {
    const LEGACY_COOKIE_SWEEP_UNTIL_MS = Date.parse('2027-04-07T23:59:59.999Z')
    const LEGACY_COOKIE_SWEEP_MARKER = 'tilda_legacy_cookie_sweep'
    const LEGACY_COOKIE_SWEEP_MARKER_VALUE = '1'
    /** Marker lifetime: keep longer than sweep window so we do not re-enter the loop. */
    const LEGACY_COOKIE_SWEEP_MARKER_MAX_AGE_SEC = 400 * 24 * 60 * 60
    /** Blitz-style session prefix + NextAuth (`Secure` is a flag; names stay `next-auth.*`). */
    const LEGACY_AUTH_COOKIE_PREFIXES = ['atlas_', 'next-auth.'] as const

    function isLegacyAuthCookieName(name: string) {
      return LEGACY_AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))
    }

    /** On HTTPS, legacy cookies were often `Secure`; matching that is required to clear them. */
    const sweepCookieOpts = {
      path: '/' as const,
      ...(process.env.VITE_APP_ORIGIN?.startsWith('https://') ? { secure: true as const } : {}),
    }

    nitroApp.hooks.hook('request', (event) => {
      if (Date.now() > LEGACY_COOKIE_SWEEP_UNTIL_MS) return
      if (getCookie(event, LEGACY_COOKIE_SWEEP_MARKER) === LEGACY_COOKIE_SWEEP_MARKER_VALUE) return

      const path = getRequestURL(event).pathname
      if (path.startsWith('/api/auth')) return

      // Nitro types `request` as HTTPEvent; cookie writers need `res` (H3Event only).
      const h3Event = event as H3Event

      for (const name of Object.keys(parseCookies(event))) {
        if (isLegacyAuthCookieName(name)) deleteCookie(h3Event, name, sweepCookieOpts)
      }

      setCookie(h3Event, LEGACY_COOKIE_SWEEP_MARKER, LEGACY_COOKIE_SWEEP_MARKER_VALUE, {
        ...sweepCookieOpts,
        maxAge: LEGACY_COOKIE_SWEEP_MARKER_MAX_AGE_SEC,
        sameSite: 'lax',
        httpOnly: true,
      })
    })
  }
})
