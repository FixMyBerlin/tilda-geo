import { createFileRoute } from '@tanstack/react-router'
import { exchangeOsmToken } from '@/server/api/auth/osmToken.server'
import {
  externalApiPreflightResponse,
  handleExternalApiRequest,
} from '@/server/api/util/externalApiResponses.server'

/** Token exchange for the external API; see docs/External-API-Token.md. */
export const Route = createFileRoute('/api/auth/osm-token')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: () => externalApiPreflightResponse(),
      POST: ({ request }) =>
        handleExternalApiRequest(async () => ({
          status: 201,
          body: await exchangeOsmToken(request),
        })),
    },
  },
})
