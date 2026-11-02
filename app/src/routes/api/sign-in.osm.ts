import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { auth } from '@/server/auth/auth.server'
import { getSafeSignInCallbackURL } from '@/shared/auth/safeSignInCallbackURL'

const searchSchema = z.object({
  callbackURL: optionalSearchString(),
})

function toSafeCallbackURL(rawCallbackURL: string | null, requestUrl: string) {
  const fallback = '/'
  if (!rawCallbackURL) return fallback

  try {
    const requestOrigin = new URL(requestUrl).origin
    const normalized = new URL(rawCallbackURL, requestUrl)
    // Only allow redirects back to this app origin.
    if (normalized.origin !== requestOrigin) return fallback

    // Better Auth validates callback targets against configured origins.
    // Passing a relative app path avoids host/canonical-domain drift between environments.
    return getSafeSignInCallbackURL(`${normalized.pathname}${normalized.search}`)
  } catch {
    return fallback
  }
}

export const Route = createFileRoute('/api/sign-in/osm')({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const callbackURL = toSafeCallbackURL(searchParams.get('callbackURL'), request.url)
        const errorCallbackURL = `/oAuthError?${new URLSearchParams({ callbackURL })}`

        try {
          // auth.api, not auth.handler: the rate limiter of auth.handler would see no client IP in a
          // request built here, and tanstackStartCookies only sets cookies for auth.api calls.
          const result = await auth.api.signInSocial({
            body: { provider: 'osm', callbackURL, errorCallbackURL },
          })
          if (!('url' in result) || !result.url) throw new Error('No OSM authorization URL')
          return new Response(null, { status: 302, headers: { Location: result.url } })
        } catch (error) {
          console.error('Failed to initiate OAuth sign-in:', error)
          return new Response(null, {
            status: 302,
            headers: { Location: `${errorCallbackURL}&error=oauth_sign_in_failed` },
          })
        }
      },
    },
  },
})
