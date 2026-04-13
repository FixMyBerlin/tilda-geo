import { useLocation, useRouter } from '@tanstack/react-router'

const blockedCallbackPrefixes = ['/oautherror', '/api/auth', '/api/sign-in']

const getSafeSignInCallbackURL = (pathname: string, searchStr: string) => {
  const normalizedPathname = pathname.trim().toLowerCase()
  if (blockedCallbackPrefixes.some((prefix) => normalizedPathname.startsWith(prefix))) return '/'
  return `${pathname}${searchStr}`
}

export function useSignInUrl() {
  const router = useRouter()
  const location = useLocation()
  const callbackURL = getSafeSignInCallbackURL(location.pathname, location.searchStr)
  const { href: signInHref } = router.buildLocation({
    to: '/api/sign-in/osm',
    search: { callbackURL },
  })
  return signInHref
}
