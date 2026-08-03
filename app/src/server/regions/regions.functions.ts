import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'
import { getAppSession, requireAdmin } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { membershipExists } from '@/server/memberships/queries/membershipExists.server'
import { getRegionRedirectUrl } from '@/server/regions/getRegionRedirectUrl.server'
import { lookupBoundaryOsmIds } from '@/server/regions/masks/lookupBoundaryOsmIds.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import { redactRegionForDeniedAccess } from '@/server/regions/redactRegionForDeniedAccess.server'
import { trackRegionAccess } from '@/server/users/trackRegionAccess.server'
import { validationErrorState } from '@/server/utils/validation'
import { resolveWelcomeDialogRedirectUrl } from '@/shared/regionen/resolveWelcomeDialogRedirect'
import { WELCOME_DISMISSED_COOKIE_NAME } from '@/shared/regionen/welcomeDismissCookie'
import { createRegionWithData } from './mutations/createRegion.server'
import { deleteRegion } from './mutations/deleteRegion.server'
import { updateRegionWithData } from './mutations/updateRegion.server'
import { DeleteRegionSchema, RegionFormRawSchema, RegionFormSchema } from './regionWriteSchema'

/**
 * Single server round-trip for the region page's loader: resolve redirects (slug rename /
 * ?config=/?map= migration), then — when there is no redirect — resolve the session, authorize, and
 * return the region (redacted for non-members) plus `hasPermissions`. May also return a temporary
 * redirect that adds `dialog=welcome` when the welcome panel should auto-open (cookie-aware).
 *
 * Consolidates what were three serial GET server fns (redirect → beforeLoad → loader): the region is
 * fetched and the session resolved once per navigation instead of repeatedly, and the full region is
 * no longer URL-encoded and shipped back into follow-up GET calls. Authorization is always derived
 * server-side (never from a client-supplied flag). Runs on the server for SSR and client navigations
 * (beforeLoad executes on the client for SPA navs, where importing the .server modules directly would
 * hit the browser db stub).
 */
export const getRegionPageDataFn = createServerFn({ method: 'GET' })
  .validator((data: { url: string; regionSlug: string }) => data)
  .handler(async ({ data }) => {
    const { redirectUrl, region: resolvedRegion } = await getRegionRedirectUrl(
      data.url,
      data.regionSlug,
    )
    if (redirectUrl) {
      return {
        redirectUrl,
        redirectPermanent: true as const,
        authorized: false as const,
        region: null,
        hasPermissions: false,
      }
    }

    const headers = getRequestHeaders()
    const region = resolvedRegion ?? (await getRegion({ slug: data.regionSlug }))

    const appSession = await getAppSession(headers)
    const { isAuthorized } = await checkRegionAuthorization(appSession, data.regionSlug)
    await trackRegionAccess(data.regionSlug, headers)

    if (!isAuthorized) {
      return {
        redirectUrl: null,
        redirectPermanent: true as const,
        authorized: false as const,
        region: redactRegionForDeniedAccess(region),
        hasPermissions: false,
      }
    }

    const membership =
      appSession?.userId && appSession.role !== 'ADMIN'
        ? await membershipExists({ userId: appSession.userId, regionSlug: data.regionSlug })
        : false
    const hasPermissions = appSession?.role === 'ADMIN' || membership

    const welcomeDialogUrl = resolveWelcomeDialogRedirectUrl({
      url: data.url,
      region,
      dismissedCookie: getCookie(WELCOME_DISMISSED_COOKIE_NAME),
    })
    if (welcomeDialogUrl) {
      return {
        redirectUrl: welcomeDialogUrl,
        redirectPermanent: false as const,
        authorized: true as const,
        region: null,
        hasPermissions,
      }
    }

    return {
      redirectUrl: null,
      redirectPermanent: true as const,
      authorized: true as const,
      region,
      hasPermissions,
    }
  })

export const getProcessingMetadataFn = createServerFn({ method: 'GET' }).handler(async () =>
  getProcessingMeta(),
)

export const deleteRegionFn = createServerFn({ method: 'POST' })
  .validator((data: { slug: string }) => DeleteRegionSchema.parse(data))
  .handler(async ({ data }) => deleteRegion(data, getRequestHeaders()))

export const createRegionFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof RegionFormRawSchema>) => data)
  .handler(async ({ data }) => {
    const parsed = RegionFormSchema.safeParse(data)
    if (!parsed.success) return validationErrorState(parsed.error)
    return createRegionWithData(parsed.data, getRequestHeaders())
  })

export const updateRegionFn = createServerFn({ method: 'POST' })
  .validator((data: { regionSlug: string; values: z.input<typeof RegionFormRawSchema> }) => data)
  .handler(async ({ data: { regionSlug, values } }) => {
    const parsed = RegionFormSchema.safeParse(values)
    if (!parsed.success) return validationErrorState(parsed.error)
    return updateRegionWithData(regionSlug, parsed.data, getRequestHeaders())
  })

const CheckMaskBoundaryIdsInput = z.object({
  ids: z.array(z.number().int().positive()).max(50),
})

/** Soft admin check: which mask OSM relation IDs exist in the geo `boundaries` table. */
export const checkMaskBoundaryIdsFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof CheckMaskBoundaryIdsInput>) =>
    CheckMaskBoundaryIdsInput.parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    return lookupBoundaryOsmIds(data.ids)
  })
