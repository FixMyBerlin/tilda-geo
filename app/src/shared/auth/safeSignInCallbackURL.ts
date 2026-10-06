const blockedCallbackPathPrefixes = ['/oautherror', '/api/']

const isBlockedCallbackPathname = (pathname: string) => {
  const normalized = pathname.trim().toLowerCase()
  return blockedCallbackPathPrefixes.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Better Auth only accepts a fixed set of characters in a relative `callbackURL`. Our search
 * params use more: `[`/`]` (legacy `data=[]`), commas, and `*` in `draw=` ids, which
 * `URLSearchParams` leaves as it is.
 */
const encodeSearchForAuthAllowlist = (search: string) =>
  new URLSearchParams(search).toString().replaceAll('*', '%2A')

/**
 * Relative path+search for OSM `callbackURL`, encoded so Better Auth accepts it.
 * Rejects protocol-relative, `/api/`, and `/oautherror`.
 */
export const getSafeSignInCallbackURL = (raw?: string) => {
  const trimmed = raw?.trim()
  if (!trimmed) return '/'

  if (trimmed.startsWith('//')) return '/'

  let pathAndSearch = trimmed
  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      pathAndSearch = `${url.pathname}${url.search}`
    } catch {
      return '/'
    }
  }

  if (!pathAndSearch.startsWith('/') || pathAndSearch.startsWith('//')) return '/'

  const searchStart = pathAndSearch.indexOf('?')
  const pathname = searchStart === -1 ? pathAndSearch : pathAndSearch.slice(0, searchStart)
  if (isBlockedCallbackPathname(pathname)) return '/'

  const search =
    searchStart === -1 ? '' : encodeSearchForAuthAllowlist(pathAndSearch.slice(searchStart + 1))
  return search ? `${pathname}?${search}` : pathname
}
