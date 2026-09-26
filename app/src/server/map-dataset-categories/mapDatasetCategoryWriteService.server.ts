import { z } from 'zod'
import { runWithAuditContextAsync, type AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import {
  STATIC_DATASET_CATEGORY_SUBTITLE_MAX,
  STATIC_DATASET_CATEGORY_TITLE_MAX,
} from '@/server/map-dataset-categories/mapDatasetCategoryDisplayLimits'
import { mapDatasetCategorySegmentSchema } from '@/server/map-dataset-categories/mapDatasetCategorySegment.schema'

export const mapDatasetCategoryInputFields = {
  groupKey: mapDatasetCategorySegmentSchema,
  categoryKey: mapDatasetCategorySegmentSchema,
  sortOrder: z.number(),
  title: z.string().min(1).max(STATIC_DATASET_CATEGORY_TITLE_MAX),
  subtitle: z.string().max(STATIC_DATASET_CATEGORY_SUBTITLE_MAX).nullable().optional(),
}

const refineMergedKeyLength = (
  data: { groupKey: string; categoryKey: string },
  ctx: z.RefinementCtx,
) => {
  const merged = `${data.groupKey}/${data.categoryKey}`
  if (merged.length > 191) {
    ctx.addIssue({
      code: 'custom',
      message: 'Gesamt-Schlüssel (Gruppe/Kategorie) darf höchstens 191 Zeichen haben.',
      path: ['categoryKey'],
    })
  }
}

export const CreateMapDatasetCategoryInput = z
  .object(mapDatasetCategoryInputFields)
  .superRefine(refineMergedKeyLength)

export const UpdateMapDatasetCategoryInput = z
  .object({ key: z.string().min(1).max(191), ...mapDatasetCategoryInputFields })
  .superRefine(refineMergedKeyLength)

export const DeleteMapDatasetCategoryInput = z.object({ key: z.string().min(1).max(191) })

export async function listMapDatasetCategories() {
  return db.mapDatasetCategory.findMany({
    orderBy: [{ groupKey: 'asc' }, { sortOrder: 'asc' }, { categoryKey: 'asc' }],
  })
}

export async function getMapDatasetCategory(key: string) {
  return db.mapDatasetCategory.findUnique({ where: { key } })
}

export async function createMapDatasetCategory(
  input: z.input<typeof CreateMapDatasetCategoryInput>,
  auditContext: AuditContext = {},
) {
  const data = CreateMapDatasetCategoryInput.parse(input)
  return runWithAuditContextAsync(auditContext, () =>
    db.mapDatasetCategory.create({
      data: {
        key: `${data.groupKey}/${data.categoryKey}`,
        groupKey: data.groupKey,
        categoryKey: data.categoryKey,
        sortOrder: data.sortOrder,
        title: data.title,
        subtitle: data.subtitle ?? null,
      },
    }),
  )
}

export async function updateMapDatasetCategory(
  input: z.input<typeof UpdateMapDatasetCategoryInput>,
  auditContext: AuditContext = {},
) {
  const data = UpdateMapDatasetCategoryInput.parse(input)
  const newKey = `${data.groupKey}/${data.categoryKey}`
  if (newKey !== data.key) {
    const clash = await db.mapDatasetCategory.findUnique({ where: { key: newKey } })
    if (clash) {
      return { ok: false as const, error: 'duplicate_key' as const }
    }
  }
  const category = await runWithAuditContextAsync(auditContext, () =>
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
}

export async function deleteMapDatasetCategory(key: string, auditContext: AuditContext = {}) {
  await runWithAuditContextAsync(auditContext, () =>
    db.mapDatasetCategory.delete({ where: { key } }),
  )
  return { ok: true as const }
}
