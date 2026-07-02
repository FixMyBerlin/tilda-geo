import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/server/auth/auth.server'

// Returns auth.handler directly so the tanstackStartCookies plugin applies cookies for us.
// ssr: false keeps this a handler-only API route (no client render / no server-only marker).
export const Route = createFileRoute('/api/auth/$')({
  ssr: false,
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
