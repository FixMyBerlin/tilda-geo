import { regionDialogParamSchema } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { isWelcomeDismissedSlug } from '@/shared/regionen/welcomeDismissCookie'

type WelcomeRedirectRegion = {
  slug: string
  status: string
  welcome?: { enabled: boolean } | null
}

const welcomeDialog = regionDialogParamSchema.enum.welcome

/**
 * When the region has an enabled public welcome and the browser has not dismissed it,
 * return a same-path URL with `dialog=welcome` so the loader can 302. Returns null when
 * the URL already has the dialog, skip flag, or dismiss cookie.
 */
export const resolveWelcomeDialogRedirectUrl = ({
  url,
  region,
  dismissedCookie,
}: {
  url: string
  region: WelcomeRedirectRegion
  dismissedCookie: string | undefined
}) => {
  if (region.status !== 'PUBLIC' || !region.welcome?.enabled) return null

  const absoluteUrl = new URL(url, import.meta.env.VITE_APP_ORIGIN)
  const dialog = absoluteUrl.searchParams.get(searchParamsRegistry.dialog)
  if (dialog === welcomeDialog) return null

  const skip = absoluteUrl.searchParams.get(searchParamsRegistry.welcomeSkipDialog)
  if (skip === welcomeDialog) return null

  if (isWelcomeDismissedSlug(dismissedCookie, region.slug)) return null

  absoluteUrl.searchParams.set(searchParamsRegistry.dialog, welcomeDialog)
  return absoluteUrl.toString()
}
