import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { membershipExists } from '@/server/memberships/queries/membershipExists.server'
import { getRegionRedirectUrl } from '@/server/regions/getRegionRedirectUrl.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { trackRegionAccess } from '@/server/users/trackRegionAccess.server'
import { createRegionWithData } from './mutations/createRegion.server'
import { deleteRegion } from './mutations/deleteRegion.server'
import {
  RegionMaskActionSchema,
  generateRegionMaskWithData,
} from './mutations/generateRegionMask.server'
import { updateRegionWithData } from './mutations/updateRegion.server'
import { DeleteRegionSchema, RegionFormRawSchema, RegionFormSchema } from './regionWriteSchema'

/**
 * Strip a region's sensitive config for the unauthorized (access-denied) view. Keeps only what the
 * denied screen (status) and the page <head> (name/fullName/product) render; blanks categories,
 * mask (OSM relation IDs), contract, nav links, map center, exports and bbox — so a slug-guesser
 * can't read a PRIVATE/DEACTIVATED region's full configuration through this directly-callable RPC.
 */
function redactRegionForDeniedAccess(region: TRegion): TRegion {
  return {
    ...region,
    mask: null,
    map: { lat: 0, lng: 0, zoom: 0 },
    categories: [],
    backgroundSources: [],
    navigationLinks: [],
    cacheWarming: undefined,
    contract: null,
    exports: null,
    bbox: null,
  }
}

/**
 * Single server round-trip for the region page's `beforeLoad`: resolve redirects (slug rename /
 * ?config=/?map= migration), then — when there is no redirect — resolve the session, authorize, and
 * return the region (redacted for non-members) plus `hasPermissions`.
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
      return { redirectUrl, authorized: false as const, region: null, hasPermissions: false }
    }

    const headers = getRequestHeaders()
    const region = resolvedRegion ?? (await getRegion({ slug: data.regionSlug }))

    const appSession = await getAppSession(headers)
    const { isAuthorized } = await checkRegionAuthorization(appSession, data.regionSlug)
    await trackRegionAccess(data.regionSlug, headers)

    if (!isAuthorized) {
      return {
        redirectUrl: null,
        authorized: false as const,
        region: redactRegionForDeniedAccess(region),
        hasPermissions: false,
      }
    }

    const membership =
      appSession?.userId && appSession.role !== 'ADMIN'
        ? await membershipExists({ userId: appSession.userId, regionSlug: data.regionSlug })
        : false

    return {
      redirectUrl: null,
      authorized: true as const,
      region,
      hasPermissions: appSession?.role === 'ADMIN' || membership,
    }
  })

export const getProcessingMetadataFn = createServerFn({ method: 'GET' }).handler(async () =>
  getProcessingMeta(),
)

export const deleteRegionFn = createServerFn({ method: 'POST' })
  .validator((data: { slug: string }) => DeleteRegionSchema.parse(data))
  .handler(async ({ data }) => deleteRegion(data, getRequestHeaders()))

export const createRegionFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof RegionFormSchema>) => RegionFormSchema.parse(data))
  .handler(async ({ data }) => createRegionWithData(data, getRequestHeaders()))

export const updateRegionFn = createServerFn({ method: 'POST' })
  .validator((data: { regionSlug: string } & { values: z.input<typeof RegionFormRawSchema> }) => {
    const { regionSlug, values } = data
    return { regionSlug, data: RegionFormSchema.parse(values) }
  })
  .handler(async ({ data: { regionSlug, data } }) =>
    updateRegionWithData(regionSlug, data, getRequestHeaders()),
  )

export const generateRegionMaskFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof RegionMaskActionSchema>) => data)
  .handler(async ({ data }) => {
    const parsed = RegionMaskActionSchema.safeParse(data)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Ungültige Masken-Eingabe'
      return { success: false as const, message }
    }

    try {
      const result = await generateRegionMaskWithData(parsed.data, getRequestHeaders())
      return result
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Maske konnte nicht aktualisiert werden'
      return { success: false as const, message }
    }
  })
