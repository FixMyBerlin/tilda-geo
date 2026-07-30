import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auditLogListSchema } from '@/server/audit/auditLogFilters.schema'
import {
  getAuditHistoryForRecord,
  getAuditHistoryForRegionEdit,
  listAuditLog,
} from '@/server/audit/queries/listAuditLog.server'
import { requireAdmin } from '@/server/auth/session.server'
import { getQaConfig } from '@/server/qa-configs/queries/getQaConfig.server'
import { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { getQaConfigStatsForAdmin } from '@/server/qa-configs/queries/getQaConfigStatsForAdmin.server'
import { getRegionContractBySlug } from '@/server/region-contracts/queries/getRegionContract.server'
import { getRegionContracts } from '@/server/region-contracts/queries/getRegionContracts.server'
import { getRegionEditData } from '@/server/regions/queries/getRegion.server'
import { getRegionRows, getRegions } from '@/server/regions/queries/getRegions.server'
import { getUploads } from '@/server/uploads/queries/getUploads.server'
import { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { getUsers } from '@/server/users/queries/getUsers.server'
import { getUsersAndMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { getUsersForRegion } from '@/server/users/queries/getUsersForRegion.server'
import { createOffsetSearchSchema } from '@/shared/pagination/offsetSearchSchema'

export const getAdminRegionsLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  // Server fns are independently callable RPC endpoints; the /admin beforeLoad guards page nav but
  // not direct calls. getRegions() returns ALL regions incl. the joined contract, so guard it here.
  await requireAdmin(getRequestHeaders())
  const regions = await getRegions()
  return { regions }
})

export const getAdminRegionNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const contracts = await getRegionContracts(headers)
  return { contracts }
})

const AdminRegionEditInput = z.object({ regionSlug: z.string() })

export const getAdminRegionEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminRegionEditInput>) => AdminRegionEditInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await requireAdmin(headers)
    const [{ region, config: formConfig, maskConfig }, users, contracts] = await Promise.all([
      getRegionEditData({ slug: data.regionSlug }),
      getUsersForRegion({ regionSlug: data.regionSlug }, headers),
      getRegionContracts(headers),
    ])
    const auditHistory = await getAuditHistoryForRegionEdit(headers, region.id)
    return { region, users, formConfig, maskConfig, contracts, auditHistory }
  })

const AdminUploadsLoaderInput = createOffsetSearchSchema({ maxTake: 200 })

export const getAdminUploadsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminUploadsLoaderInput>) =>
    AdminUploadsLoaderInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => getUploads(data, getRequestHeaders()))

const AdminUploadLoaderInput = z.object({ slug: z.string() })

export const getAdminUploadLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminUploadLoaderInput>) => AdminUploadLoaderInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const upload = await getUploadWithRegions({ slug: data.slug }, headers)
    const auditHistory = await getAuditHistoryForRecord(
      headers,
      'MapDatasetUpload',
      String(upload.id),
    )
    return { upload, auditHistory }
  })

const AdminQaConfigEditInput = z.object({ id: z.number() })

export const getAdminQaConfigEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminQaConfigEditInput>) => AdminQaConfigEditInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const [qaConfig, regions, auditHistory] = await Promise.all([
      getQaConfig({ id: data.id }, headers),
      getRegionRows({}, headers),
      getAuditHistoryForRecord(headers, 'QaConfig', String(data.id)),
    ])
    return { qaConfig, regions, auditHistory }
  })

export const getAdminQaConfigNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const regions = await getRegionRows({}, getRequestHeaders())
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

const AdminMembershipsLoaderInput = createOffsetSearchSchema({ maxTake: 200 })

export const getAdminMembershipsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminMembershipsLoaderInput>) =>
    AdminMembershipsLoaderInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => getUsersAndMemberships(data, getRequestHeaders()))

export const getAdminRegionContractsLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const contracts = await getRegionContracts(getRequestHeaders())
    return { contracts }
  },
)

const AdminRegionContractEditInput = z.object({ slug: z.string() })

export const getAdminRegionContractEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminRegionContractEditInput>) =>
    AdminRegionContractEditInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await requireAdmin(headers)
    const [contract, regions] = await Promise.all([
      getRegionContractBySlug(data.slug),
      getRegions(),
    ])
    const auditHistory = await getAuditHistoryForRecord(
      headers,
      'RegionContract',
      String(contract.id),
    )
    return { contract, regions, auditHistory }
  })

export const getAdminRegionContractNewLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin(getRequestHeaders())
    const regions = await getRegions()
    return { regions }
  },
)

export const getAdminMembershipNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  await requireAdmin(headers)
  const [regions, users] = await Promise.all([getRegions(), getUsers({}, headers)])
  return { regions, users }
})

export const getAdminAuditLogLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof auditLogListSchema>) => auditLogListSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    return listAuditLog(data)
  })
