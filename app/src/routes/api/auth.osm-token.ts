import { createFileRoute } from '@tanstack/react-router'
import { exchangeOsmToken } from '@/server/api/auth/osmToken.server'
import { externalApiPreflightResponse } from '@/server/api/util/externalApiCors.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'

/** Token exchange for the external API; see docs/External-Notes-API.md. */
export const Route = createFileRoute('/api/auth/osm-token')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: ({ request }) => externalApiPreflightResponse(request),
      POST: ({ request }) =>
        handleExternalApiRequest(request, async () => ({
          status: 201,
          body: await exchangeOsmToken(request),
        })),
    },
  },
})
