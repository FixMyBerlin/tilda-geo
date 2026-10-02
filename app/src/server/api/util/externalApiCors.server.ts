import { externalApiOrigins } from '@/components/shared/utils/appInstances.const'

/**
 * CORS for the external notes API only. `allowed: false` is a browser request from an origin that is not
 * on the allow-list. Requests without an `Origin` header are not browser cross-origin requests
 * (curl, server to server); CORS does not apply to them and the Bearer token is the access check.
 */
export function externalApiCors(request: Request) {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {}
  if (!origin) return { allowed: true, headers }
  if (!externalApiOrigins.includes(origin)) return { allowed: false, headers }
  return { allowed: true, headers: { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } }
}

export function externalApiPreflightResponse(request: Request) {
  const cors = externalApiCors(request)
  if (!cors.allowed) return new Response(null, { status: 403 })
  return new Response(null, {
    status: 204,
    headers: {
      ...cors.headers,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '600',
    },
  })
}
