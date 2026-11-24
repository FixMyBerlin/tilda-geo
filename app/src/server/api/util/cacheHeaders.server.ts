/**
 * The answer depends on who asks (cookie or Bearer token): shared caches must not keep it, and the
 * browser asks again each time (`If-None-Match` gives a cheap 304 once the access is checked).
 */
export function withPrivateCaching(response: Response) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, no-cache')
  headers.append('Vary', 'Authorization, Cookie')
  return new Response(response.body, { status: response.status, headers })
}

/** Headers for a denied or failed access check: never cached. */
export const noStoreHeaders = { 'Cache-Control': 'no-store' }
