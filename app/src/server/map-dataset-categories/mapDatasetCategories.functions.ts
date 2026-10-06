import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { getAuditHistoryForRecord } from '@/server/audit/queries/listAuditLog.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  createMapDatasetCategory,
  CreateMapDatasetCategoryInput,
  deleteMapDatasetCategory,
  DeleteMapDatasetCategoryInput,
  getMapDatasetCategory,
  listMapDatasetCategories,
  updateMapDatasetCategory,
  UpdateMapDatasetCategoryInput,
} from '@/server/map-dataset-categories/mapDatasetCategoryWriteService.server'

const CategoryKeyParam = z.object({ categoryKey: z.string() })

export const getMapDatasetCategoriesAdminListFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin(getRequestHeaders())
    return { categories: await listMapDatasetCategories() }
  },
)

export const getMapDatasetCategoryAdminOneFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof CategoryKeyParam>) => CategoryKeyParam.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    const category = await getMapDatasetCategory(decodeURIComponent(data.categoryKey))
    if (!category) throw notFound()
    const relatedCategories = await db.mapDatasetCategory.findMany({
      where: { groupKey: category.groupKey, NOT: { key: category.key } },
      orderBy: [{ sortOrder: 'asc' }, { categoryKey: 'asc' }],
      select: { key: true, categoryKey: true, sortOrder: true, title: true },
    })
    const auditHistory = await getAuditHistoryForRecord(
      getRequestHeaders(),
      'MapDatasetCategory',
      String(category.id),
    )
    return { category, relatedCategories, auditHistory }
  })

export const createMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateMapDatasetCategoryInput>) =>
    CreateMapDatasetCategoryInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    return createMapDatasetCategory(data, adminFormAuditContext(headers, admin.userId))
  })

export const updateMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateMapDatasetCategoryInput>) =>
    UpdateMapDatasetCategoryInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    return updateMapDatasetCategory(data, adminFormAuditContext(headers, admin.userId))
  })

export const deleteMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteMapDatasetCategoryInput>) =>
    DeleteMapDatasetCategoryInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    return deleteMapDatasetCategory(data.key, adminFormAuditContext(headers, admin.userId))
  })
