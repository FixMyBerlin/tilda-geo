import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { membershipExists } from '@/server/memberships/queries/membershipExists.server'
import type { TRegion } from '@/server/regions/queries/getRegion.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import { trackRegionAccess } from '@/server/users/trackRegionAccess.server'
import { createRegionWithData } from './mutations/createRegion.server'
import { deleteRegion } from './mutations/deleteRegion.server'
import { updateRegionWithData } from './mutations/updateRegion.server'
import { getProcessingMetadata } from './queries/getProcessingMetadata.server'
import { DeleteRegionSchema, RegionFormSchema } from './schemas'

const RegionPageBeforeLoadInput = z.object({
  regionSlug: z.string(),
  url: z.string(),
})

export const getRegionPageBeforeLoadFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionPageBeforeLoadInput>) =>
    RegionPageBeforeLoadInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const appSession = await getAppSession(headers)
    const { isAuthorized } = await checkRegionAuthorization(appSession, data.regionSlug)
    const region = await getRegion({ slug: data.regionSlug })
    return { isAuthorized, region }
  })

type RegionPageLoaderInput = {
  regionSlug: string
  isAuthorized: boolean
  /** When provided (from beforeLoad context), avoids duplicate getRegion call. */
  region?: TRegion
}

const RegionPageLoaderInputSchema = z
  .object({
    regionSlug: z.string(),
    isAuthorized: z.boolean(),
    region: z.unknown().optional(),
  })
  .transform(
    (data): RegionPageLoaderInput => ({
      ...data,
      region: data.region as TRegion | undefined,
    }),
  )

export const getRegionPageLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.input<typeof RegionPageLoaderInputSchema>) =>
    RegionPageLoaderInputSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await trackRegionAccess(data.regionSlug, headers)

    const region = data.region ?? (await getRegion({ slug: data.regionSlug }))

    if (!data.isAuthorized) {
      return {
        authorized: false,
        region,
      }
    }

    const appSession = await getAppSession(headers)
    const userId = appSession?.userId
    const role = appSession?.role
    const membership =
      userId && role !== 'ADMIN'
        ? await membershipExists({ userId, regionSlug: data.regionSlug })
        : false

    return {
      authorized: true,
      region,
      hasPermissions: role === 'ADMIN' || membership,
    }
  })

export const getProcessingMetadataFn = createServerFn({ method: 'GET' }).handler(async () =>
  getProcessingMetadata(),
)

export const deleteRegionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { slug: string }) => DeleteRegionSchema.parse(data))
  .handler(async ({ data }) => deleteRegion(data, getRequestHeaders()))

export const createRegionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof RegionFormSchema>) => RegionFormSchema.parse(data))
  .handler(async ({ data }) => createRegionWithData(data, getRequestHeaders()))

export const updateRegionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof RegionFormSchema>) => RegionFormSchema.parse(data))
  .handler(async ({ data }) => updateRegionWithData(data, getRequestHeaders()))
