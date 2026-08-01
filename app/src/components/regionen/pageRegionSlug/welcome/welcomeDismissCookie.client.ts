import Cookies from 'js-cookie'
import { isProd } from '@/components/shared/utils/isEnv'
import {
  addWelcomeDismissedSlug,
  WELCOME_DISMISSED_COOKIE_MAX_AGE_SECONDS,
  WELCOME_DISMISSED_COOKIE_NAME,
} from '@/shared/regionen/welcomeDismissCookie'

const legacyLocalStorageKey = (slug: string) => `region-welcome-dismissed:${slug}`

/** Persist dismiss for this region; merges into the shared slug list cookie. */
export const writeWelcomeDismissedCookie = (slug: string) => {
  const current = Cookies.get(WELCOME_DISMISSED_COOKIE_NAME)
  const next = addWelcomeDismissedSlug(current, slug)
  Cookies.set(WELCOME_DISMISSED_COOKIE_NAME, next, {
    path: '/',
    sameSite: 'lax',
    expires: WELCOME_DISMISSED_COOKIE_MAX_AGE_SECONDS / (60 * 60 * 24),
    secure: isProd,
  })
  try {
    localStorage.removeItem(legacyLocalStorageKey(slug))
  } catch {
    // Ignore quota / private-mode failures; cookie is the source of truth.
  }
}
