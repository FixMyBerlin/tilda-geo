import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createFileRoute } from '@tanstack/react-router'
import { guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { buildMcpServer } from '@/server/mcp/buildMcpServer'

/**
 * Remote MCP endpoint, served by the app at `DOMAIN/mcp` in every environment (local/staging/prod).
 * Uses the SDK's web-standard Streamable HTTP transport in STATELESS JSON mode (a fresh server +
 * transport per request — no session store, proxy-friendly through Traefik). Auth reuses the admin
 * API tokens via `guardAdminApi`; the same Bearer token is what the Cursor config carries.
 */
async function handleMcpRequest(request: Request): Promise<Response> {
  const guard = await guardAdminApi(request)
  if (!guard.access) return guard.response

  const server = buildMcpServer({ auth: guard.auth, request })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  })

  // Stateless JSON mode returns a fully-buffered Response (no open SSE stream), so the per-request
  // server + transport are simply garbage-collected after this returns — no explicit close needed.
  await server.connect(transport)
  return transport.handleRequest(request)
}

export const Route = createFileRoute('/mcp')({
  ssr: false,
  server: {
    handlers: {
      POST: ({ request }) => handleMcpRequest(request),
      GET: ({ request }) => handleMcpRequest(request),
      DELETE: ({ request }) => handleMcpRequest(request),
    },
  },
})
