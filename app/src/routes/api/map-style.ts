import { createFileRoute } from '@tanstack/react-router'
import { mapStyleResponse } from '@/server/api/map-style/mapStyleResponse'

export const Route = createFileRoute('/api/map-style')({
  ssr: false,
  server: {
    handlers: {
      GET: ({ request }) => mapStyleResponse(request),
    },
  },
})
