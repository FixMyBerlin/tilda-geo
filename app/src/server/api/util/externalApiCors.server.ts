/**
 * CORS for the external notes API only: any origin may call it from a browser. The API uses no
 * cookies; the Bearer token and the member checks behind it are the access check.
 */
export const externalApiCorsHeaders = { 'Access-Control-Allow-Origin': '*' }

export function externalApiPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      ...externalApiCorsHeaders,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '600',
    },
  })
}
