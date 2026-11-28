/**
 * The answer depends on who asks (cookie or Bearer token): shared caches must not keep it, the
 * browser may keep it for one hour, like a public upload (`proxyS3Url.server.ts`). Removing a
 * member therefore takes effect in the browser after at most one hour. After that the file
 * answers reply `304` to a matching `If-None-Match` once the access is checked, see
 * `ifNoneMatchHasEtag`. `Vary` keeps a cookie answer and a token answer apart.
 */
export function withPrivateCaching(response: Response) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, max-age=3600, must-revalidate')
  headers.append('Vary', 'Authorization, Cookie')
  return new Response(response.body, { status: response.status, headers })
}

/** Does the `If-None-Match` of the request name this ETag? Weak comparison, as for a `304` of GET and HEAD. */
export function ifNoneMatchHasEtag(request: Request, etag: string | undefined) {
  const header = request.headers.get('if-none-match')?.trim()
  if (!header || !etag) return false
  if (header === '*') return true
  const withoutWeakPrefix = (value: string) => value.trim().replace(/^W\//, '')
  return header.split(',').some((value) => withoutWeakPrefix(value) === withoutWeakPrefix(etag))
}
