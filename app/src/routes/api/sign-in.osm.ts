import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { forwardAuthAndApplyCookies } from '@/server/auth/auth-route-handler.server'

const searchSchema = z.object({
  callbackURL: z.string().optional(),
})

function buildOAuthErrorRedirect(
  requestUrl: string,
  params: { error: string; error_description?: string },
) {
  const location = new URL('/oAuthError', requestUrl)
  location.searchParams.set('error', params.error)
  if (params.error_description) {
    location.searchParams.set('error_description', params.error_description)
  }
  return location.toString()
}

function toSafeCallbackURL(rawCallbackURL: string | null, requestUrl: string) {
  const fallback = '/'
  if (!rawCallbackURL) return fallback

  try {
    const requestOrigin = new URL(requestUrl).origin
    const normalized = new URL(rawCallbackURL, requestUrl)
    // Only allow redirects back to this app origin.
    if (normalized.origin !== requestOrigin) return fallback

    return normalized.toString()
  } catch {
    return fallback
  }
}

export const Route = createFileRoute('/api/sign-in/osm')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const callbackURL = toSafeCallbackURL(searchParams.get('callbackURL'), request.url)

        const authUrl = new URL('/api/auth/sign-in/oauth2', request.url)
        const authRequest = new Request(authUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: 'osm', callbackURL }),
        })

        try {
          const authResponse = await forwardAuthAndApplyCookies(authRequest)
          const data = (await authResponse.json().catch(() => null)) as {
            url?: string
            code?: string
            message?: string
          } | null

          if (!authResponse.ok) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: buildOAuthErrorRedirect(request.url, {
                  error: data?.code ?? 'oauth_sign_in_failed',
                  error_description:
                    data?.message ?? 'Die Anmeldung konnte nicht gestartet werden.',
                }),
              },
            })
          }

          if (data?.url) {
            return new Response(null, {
              status: 302,
              headers: { Location: new URL(data.url).toString() },
            })
          }

          return new Response(null, {
            status: 302,
            headers: {
              Location: buildOAuthErrorRedirect(request.url, {
                error: 'oauth_sign_in_missing_redirect',
                error_description:
                  'Die Anmeldung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
              }),
            },
          })
        } catch (error) {
          console.error('Failed to initiate OAuth sign-in:', error)
          return new Response(null, {
            status: 302,
            headers: {
              Location: buildOAuthErrorRedirect(request.url, {
                error: 'oauth_sign_in_exception',
                error_description:
                  'Die Anmeldung konnte wegen eines Serverfehlers nicht gestartet werden.',
              }),
            },
          })
        }
      },
    },
  },
})
