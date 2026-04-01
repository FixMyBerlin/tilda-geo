import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { forwardAuthAndApplyCookies } from '@/server/auth/auth-route-handler.server'

const searchSchema = z.object({
  callbackURL: z.string().optional(),
})

export const Route = createFileRoute('/api/sign-in/osm')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const callbackURL = searchParams.get('callbackURL') || '/'

        const authUrl = new URL('/api/auth/sign-in/oauth2', request.url)
        const authRequest = new Request(authUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId: 'osm', callbackURL }),
        })

        try {
          const authResponse = await forwardAuthAndApplyCookies(authRequest)
          const data = (await authResponse.json()) as { url?: string }

          if (data?.url) {
            return new Response(null, {
              status: 302,
              headers: { Location: new URL(data.url).toString() },
            })
          }

          return new Response(null, {
            status: 302,
            headers: { Location: new URL('/', request.url).toString() },
          })
        } catch (error) {
          console.error('Failed to initiate OAuth sign-in:', error)
          return new Response(null, {
            status: 302,
            headers: { Location: new URL('/', request.url).toString() },
          })
        }
      },
    },
  },
})
