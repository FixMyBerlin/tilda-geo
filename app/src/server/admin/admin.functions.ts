import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getQaConfig } from '@/server/qa-configs/queries/getQaConfig.server'
import { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { getQaConfigStatsForAdmin } from '@/server/qa-configs/queries/getQaConfigStatsForAdmin.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import { getRegions } from '@/server/regions/queries/getRegions.server'
import { getRegionsWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import { getUploads } from '@/server/uploads/queries/getUploads.server'
import { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { getUsers } from '@/server/users/queries/getUsers.server'
import { getUsersAndMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { getUsersForRegion } from '@/server/users/queries/getUsersForRegion.server'

export const getAdminRegionsLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const regions = await getRegionsWithAdditionalData()
  return { regions }
})

const AdminRegionEditInput = z.object({ regionSlug: z.string() })

export const getAdminRegionEditLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof AdminRegionEditInput>) => AdminRegionEditInput.parse(data))
  .handler(async ({ data }) => {
    const [region, users] = await Promise.all([
      getRegion({ slug: data.regionSlug }),
      getUsersForRegion({ regionSlug: data.regionSlug }, getRequestHeaders()),
    ])
    return { region, users }
  })

export const getAdminUploadsLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { uploads } = await getUploads({}, getRequestHeaders())
  return { uploads }
})

const AdminUploadLoaderInput = z.object({ slug: z.string() })

export const getAdminUploadLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof AdminUploadLoaderInput>) =>
    AdminUploadLoaderInput.parse(data),
  )
  .handler(async ({ data }) => {
    const upload = await getUploadWithRegions({ slug: data.slug }, getRequestHeaders())
    return { upload }
  })

const AdminQaConfigEditInput = z.object({ id: z.number() })

export const getAdminQaConfigEditLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof AdminQaConfigEditInput>) =>
    AdminQaConfigEditInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const [qaConfig, regions] = await Promise.all([
      getQaConfig({ id: data.id }, headers),
      getRegions({}, headers),
    ])
    return { qaConfig, regions }
  })

export const getAdminQaConfigNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const regions = await getRegions({}, getRequestHeaders())
  return { regions }
})

export const getAdminQaConfigsLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const qaConfigs = await getQaConfigsForAdmin(headers)
  const statsByConfigId = Object.fromEntries(
    await Promise.all(
      qaConfigs.map(async (qaConfig) => {
        const stats = await getQaConfigStatsForAdmin({ configId: qaConfig.id }, headers)
        return [qaConfig.id, stats] as const
      }),
    ),
  )
  return { qaConfigs, statsByConfigId }
})

const AdminMembershipsLoaderInput = z.object({ take: z.number().optional() })

export const getAdminMembershipsLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof AdminMembershipsLoaderInput>) =>
    AdminMembershipsLoaderInput.parse(data),
  )
  .handler(async ({ data }) => {
    const { users } = await getUsersAndMemberships({ take: data.take }, getRequestHeaders())
    return { users }
  })

export const getAdminMembershipNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const [regions, users] = await Promise.all([
    getRegionsWithAdditionalData(),
    getUsers({}, getRequestHeaders()),
  ])
  return { regions, users }
})
