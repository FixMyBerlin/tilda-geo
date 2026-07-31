import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createFileRoute } from '@tanstack/react-router'
import { guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { buildMcpServer } from '@/server/mcp/buildMcpServer'

/**
 * Remote MCP endpoint, served by the app at `DOMAIN/mcp` in every environment (local/staging/prod).
 * Uses the SDK's web-standard Streamable HTTP transport in STATELESS JSON mode (a fresh server +
 * transport per request — no session store, proxy-friendly through Traefik). Auth reuses the admin
 * API tokens via `guardAdminApi`; the same Bearer token is what the Cursor config carries.
 *
 * GET (standalone SSE) and DELETE (session teardown) are unsupported in this mode — the MCP
 * Streamable HTTP spec says to return 405. Cursor opens GET after connect; returning 500 from a
 * broken SSE stream marks the server red even though POST tools work.
 */
async function handleMcpPost(request: Request): Promise<Response> {
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

function methodNotAllowed() {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    }),
    {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
    },
  )
}

export const Route = createFileRoute('/mcp')({
  ssr: false,
  server: {
    handlers: {
      POST: ({ request }) => handleMcpPost(request),
      GET: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
    },
  },
})
