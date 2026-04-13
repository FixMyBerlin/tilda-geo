import { useLocation, useRouter } from '@tanstack/react-router'

export function useSignInUrl() {
  const router = useRouter()
  const location = useLocation()
  const { href: signInHref } = router.buildLocation({
    to: '/api/sign-in/osm',
    search: { callbackURL: `${location.pathname}${location.searchStr}` },
  })
  return signInHref
}
