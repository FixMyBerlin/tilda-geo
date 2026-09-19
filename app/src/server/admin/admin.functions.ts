import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { subDays } from 'date-fns'
import { z } from 'zod'
import { mapDatasetUploadsSearchSchema } from '@/lib/mapDatasetUploadsSearchSchema'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { auditLogListSchema } from '@/server/audit/auditLogFilters.schema'
import { getAuditHistoryForRecord, listAuditLog } from '@/server/audit/queries/listAuditLog.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getNoteFolder } from '@/server/notes/queries/getNoteFolder.server'
import { getNoteFoldersForAdmin } from '@/server/notes/queries/getNoteFoldersForAdmin.server'
import { getQaConfig } from '@/server/qa-configs/queries/getQaConfig.server'
import { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { getQaConfigStatsForAdmin } from '@/server/qa-configs/queries/getQaConfigStatsForAdmin.server'
import { getQaOrphanedEvaluationsForAdmin } from '@/server/qa-configs/queries/getQaOrphanedEvaluationsForAdmin.server'
import { getRegionContractBySlug } from '@/server/region-contracts/queries/getRegionContract.server'
import { getRegionContracts } from '@/server/region-contracts/queries/getRegionContracts.server'
import { getRegionEditData } from '@/server/regions/queries/getRegion.server'
import { getRegionAdminLinkCounts } from '@/server/regions/queries/getRegionAdminLinkCounts.server'
import { getRegionRows, getRegions } from '@/server/regions/queries/getRegions.server'
import { getReviewList } from '@/server/review-lists/queries/getReviewList.server'
import { getReviewListsForAdmin } from '@/server/review-lists/queries/getReviewListsForAdmin.server'
import {
  buildMapDatasetUploadsFilterWhere,
  buildMapDatasetUploadsWhere,
} from '@/server/uploads/buildMapDatasetUploadsWhere.server'
import { getUploads } from '@/server/uploads/queries/getUploads.server'
import { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { buildUsersAndMembershipsWhere } from '@/server/users/buildUsersAndMembershipsWhere.server'
import { getUsers } from '@/server/users/queries/getUsers.server'
import { getUsersAndMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { optionalTrimmed } from '@/server/utils/searchString'
import { createPageSearchSchema } from '@/shared/pagination/pageSearchSchema'
import { pageToSkipTake } from '@/shared/pagination/pageToSkipTake'

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
    const [{ region, config: formConfig, formValues }, contracts] = await Promise.all([
      getRegionEditData({ slug: data.regionSlug }),
      getRegionContracts(headers),
    ])
    const linkCounts = await getRegionAdminLinkCounts(region)
    return { region, formConfig, formValues, contracts, linkCounts }
  })

const AdminUploadsLoaderInput = mapDatasetUploadsSearchSchema

export const getAdminUploadsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminUploadsLoaderInput>) =>
    AdminUploadsLoaderInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await requireAdmin(headers)
    const where = buildMapDatasetUploadsWhere(data)
    const filterWhere = buildMapDatasetUploadsFilterWhere(data)
    const [result, datasetsCount, systemCount] = await Promise.all([
      getUploads({ where, ...pageToSkipTake(data) }, headers),
      db.mapDatasetUpload.count({ where: { ...filterWhere, systemLayer: false } }),
      db.mapDatasetUpload.count({ where: { ...filterWhere, systemLayer: true } }),
    ])
    return {
      ...result,
      kindCounts: { datasets: datasetsCount, system: systemCount },
    }
  })

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

const AdminQaConfigEditInput = z.object({ id: z.number() }).extend(createPageSearchSchema().shape)

export const getAdminQaConfigEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminQaConfigEditInput>) => AdminQaConfigEditInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const [qaConfig, regions, auditHistory, stats] = await Promise.all([
      getQaConfig({ id: data.id }, headers),
      getRegionRows({}, headers),
      getAuditHistoryForRecord(headers, 'QaConfig', String(data.id)),
      getQaConfigStatsForAdmin({ configId: data.id }, headers),
    ])
    const orphanedEvaluations = await getQaOrphanedEvaluationsForAdmin(
      { configId: qaConfig.id, mapTable: qaConfig.mapTable, ...pageToSkipTake(data) },
      headers,
    )
    return { qaConfig, regions, auditHistory, orphanedEvaluations, stats }
  })

export const getAdminQaConfigNewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const regions = await getRegionRows({}, getRequestHeaders())
  return { regions }
})

const AdminRegionFilterInput = z.object({
  regionSlug: optionalSearchString().catch(undefined),
})

export const getAdminQaConfigsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminRegionFilterInput>) =>
    AdminRegionFilterInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const qaConfigs = await getQaConfigsForAdmin(data, getRequestHeaders())
    return { qaConfigs }
  })

export const getAdminReviewListsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminRegionFilterInput>) =>
    AdminRegionFilterInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const lists = await getReviewListsForAdmin(data, getRequestHeaders())
    return { lists }
  })

const AdminReviewListEditInput = z.object({ id: z.number() })

export const getAdminReviewListEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminReviewListEditInput>) =>
    AdminReviewListEditInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await requireAdmin(headers)
    const [list, regions, auditHistory] = await Promise.all([
      getReviewList({ id: data.id }, headers),
      getRegions(),
      getAuditHistoryForRecord(headers, 'ReviewList', String(data.id)),
    ])
    return { list, regions, auditHistory }
  })

export const getAdminNoteFoldersLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminRegionFilterInput>) =>
    AdminRegionFilterInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const folders = await getNoteFoldersForAdmin(data, getRequestHeaders())
    return { folders }
  })

const AdminNoteFolderEditInput = z.object({ id: z.number() })

export const getAdminNoteFolderEditLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AdminNoteFolderEditInput>) =>
    AdminNoteFolderEditInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await requireAdmin(headers)
    const [folder, regions, auditHistory] = await Promise.all([
      getNoteFolder({ id: data.id }, headers),
      getRegions(),
      getAuditHistoryForRecord(headers, 'NoteFolder', String(data.id)),
    ])
    return { folder, regions, auditHistory }
  })

const AdminMembershipsLoaderInput = createPageSearchSchema().extend({
  q: optionalSearchString(),
  regionSlug: optionalSearchString(),
})

export const getAdminMembershipsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminMembershipsLoaderInput>) =>
    AdminMembershipsLoaderInput.parse(data ?? {}),
  )
  .handler(async ({ data: { q, regionSlug, ...page } }) => {
    const result = await getUsersAndMemberships(
      { ...pageToSkipTake(page), where: buildUsersAndMembershipsWhere({ q, regionSlug }) },
      getRequestHeaders(),
    )
    return {
      ...result,
      // Stable cutoff for the "accessed regions" default filter (last 30 days) — computed once
      // here so the client never recomputes "now" during render (would cause a hydration mismatch).
      accessedRegionsCutoffAt: subDays(new Date(), 30).getTime(),
    }
  })

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

const AdminAuditLogLoaderInput = auditLogListSchema
  .omit({ skip: true, take: true })
  .extend(createPageSearchSchema().shape)
  .extend({ regionSlug: optionalSearchString().catch(undefined) })

export const getAdminAuditLogLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof AdminAuditLogLoaderInput>) =>
    AdminAuditLogLoaderInput.parse(data ?? {}),
  )
  .handler(async ({ data: { page, pageSize, regionSlug, ...filters } }) => {
    await requireAdmin(getRequestHeaders())
    const slug = optionalTrimmed(regionSlug)
    // `?regionSlug=` → the region's edit history scope (region row + assignment rows). An unknown
    // slug matches no region id, so the list stays empty like the other region-filtered lists.
    const region = slug
      ? await db.region.findUnique({ where: { slug }, select: { id: true } })
      : undefined
    return listAuditLog(
      {
        ...filters,
        ...(slug ? { regionId: region?.id ?? -1 } : {}),
        ...pageToSkipTake({ page, pageSize }),
      },
      { fallbackToLastPage: true },
    )
  })
