import { useLocation, useRouter } from '@tanstack/react-router'

const blockedCallbackPathPrefixes = ['/oautherror', '/api/']

const isBlockedCallbackPathname = (pathname: string) => {
  const normalized = pathname.trim().toLowerCase()
  return blockedCallbackPathPrefixes.some((prefix) => normalized.startsWith(prefix))
}

/** Relative path+search for OSM `callbackURL`. Rejects protocol-relative, `/api/`, and `/oautherror`. */
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

  const pathname = pathAndSearch.split('?')[0] ?? pathAndSearch
  if (isBlockedCallbackPathname(pathname)) return '/'

  return pathAndSearch
}

export function useSignInUrl(callbackURL?: string) {
  const router = useRouter()
  const location = useLocation()
  const safeCallbackURL = getSafeSignInCallbackURL(
    callbackURL ?? `${location.pathname}${location.searchStr}`,
  )
  const { href: signInHref } = router.buildLocation({
    to: '/api/sign-in/osm',
    search: { callbackURL: safeCallbackURL },
  })
  return signInHref
}
