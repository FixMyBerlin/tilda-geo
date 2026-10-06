import { useLocation, useRouter } from '@tanstack/react-router'
import { getSafeSignInCallbackURL } from '@/shared/auth/safeSignInCallbackURL'

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
