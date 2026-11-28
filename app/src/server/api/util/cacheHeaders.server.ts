/** Headers for a denied or failed access check: never cached. */
export const noStoreHeaders = { 'Cache-Control': 'no-store' }

/** `base` headers (e.g. CORS of the route) with the `extra` ones on top; later ones win. */
export function mergeHeaders(base: HeadersInit | undefined, ...extra: Record<string, string>[]) {
  const headers = new Headers(base)
  for (const [name, value] of extra.flatMap((entries) => Object.entries(entries))) {
    headers.set(name, value)
  }
  return headers
}
