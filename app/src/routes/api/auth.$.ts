import { createFileRoute } from '@tanstack/react-router'
import { forwardAuthAndApplyCookies } from '@/server/auth/auth-route-handler.server'

export const Route = createFileRoute('/api/auth/$')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => forwardAuthAndApplyCookies(request),
      POST: ({ request }) => forwardAuthAndApplyCookies(request),
    },
  },
})
