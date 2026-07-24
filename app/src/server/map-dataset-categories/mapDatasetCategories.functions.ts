import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { getAuditHistoryForRecord } from '@/server/audit/queries/listAuditLog.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  STATIC_DATASET_CATEGORY_SUBTITLE_MAX,
  STATIC_DATASET_CATEGORY_TITLE_MAX,
} from '@/server/map-dataset-categories/mapDatasetCategoryDisplayLimits'
import { mapDatasetCategorySegmentSchema } from '@/server/map-dataset-categories/mapDatasetCategorySegment.schema'

const CategoryKeyParam = z.object({ categoryKey: z.string() })

export const getMapDatasetCategoriesAdminListFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin(getRequestHeaders())
    const categories = await db.mapDatasetCategory.findMany({
      orderBy: [{ groupKey: 'asc' }, { sortOrder: 'asc' }, { categoryKey: 'asc' }],
    })
    return { categories }
  },
)

export const getMapDatasetCategoryAdminOneFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof CategoryKeyParam>) => CategoryKeyParam.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    const key = decodeURIComponent(data.categoryKey)
    const category = await db.mapDatasetCategory.findUnique({ where: { key } })
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

const CreateCategoryInput = z
  .object({
    groupKey: mapDatasetCategorySegmentSchema,
    categoryKey: mapDatasetCategorySegmentSchema,
    sortOrder: z.number(),
    title: z.string().min(1).max(STATIC_DATASET_CATEGORY_TITLE_MAX),
    subtitle: z.string().max(STATIC_DATASET_CATEGORY_SUBTITLE_MAX).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const merged = `${data.groupKey}/${data.categoryKey}`
    if (merged.length > 191) {
      ctx.addIssue({
        code: 'custom',
        message: 'Gesamt-Schlüssel (Gruppe/Kategorie) darf höchstens 191 Zeichen haben.',
        path: ['categoryKey'],
      })
    }
  })

export const createMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateCategoryInput>) => CreateCategoryInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    const key = `${data.groupKey}/${data.categoryKey}`
    return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.mapDatasetCategory.create({
        data: {
          key,
          groupKey: data.groupKey,
          categoryKey: data.categoryKey,
          sortOrder: data.sortOrder,
          title: data.title,
          subtitle: data.subtitle ?? null,
        },
      }),
    )
  })

const UpdateCategoryInput = z
  .object({
    key: z.string().min(1).max(191),
    groupKey: mapDatasetCategorySegmentSchema,
    categoryKey: mapDatasetCategorySegmentSchema,
    sortOrder: z.number(),
    title: z.string().min(1).max(STATIC_DATASET_CATEGORY_TITLE_MAX),
    subtitle: z.string().max(STATIC_DATASET_CATEGORY_SUBTITLE_MAX).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const merged = `${data.groupKey}/${data.categoryKey}`
    if (merged.length > 191) {
      ctx.addIssue({
        code: 'custom',
        message: 'Gesamt-Schlüssel (Gruppe/Kategorie) darf höchstens 191 Zeichen haben.',
        path: ['categoryKey'],
      })
    }
  })

export const updateMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateCategoryInput>) => UpdateCategoryInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    const newKey = `${data.groupKey}/${data.categoryKey}`
    if (newKey !== data.key) {
      const clash = await db.mapDatasetCategory.findUnique({ where: { key: newKey } })
      if (clash) {
        return { ok: false as const, error: 'duplicate_key' as const }
      }
    }
    const category = await runWithAuditContextAsync(
      adminFormAuditContext(headers, admin.userId),
      () =>
        db.mapDatasetCategory.update({
          where: { key: data.key },
          data: {
            key: newKey,
            groupKey: data.groupKey,
            categoryKey: data.categoryKey,
            sortOrder: data.sortOrder,
            title: data.title,
            subtitle: data.subtitle ?? null,
          },
        }),
    )
    return { ok: true as const, category }
  })

const DeleteCategoryInput = z.object({ key: z.string().min(1).max(191) })

export const deleteMapDatasetCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteCategoryInput>) => DeleteCategoryInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const admin = await requireAdmin(headers)
    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
      db.mapDatasetCategory.delete({ where: { key: data.key } }),
    )
    return { ok: true as const }
  })
