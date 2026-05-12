import { z } from 'zod'
import {
  STATIC_DATASET_CATEGORY_SUBTITLE_MAX,
  STATIC_DATASET_CATEGORY_TITLE_MAX,
} from '@/server/static-dataset-categories/staticDatasetCategoryDisplayLimits'
import { staticDatasetCategorySegmentSchema } from '@/server/static-dataset-categories/staticDatasetCategorySegment.schema'

const sortOrderAsString = z
  .string()
  .min(1, 'Sortierung erforderlich')
  .refine((s) => Number.isFinite(Number.parseFloat(s.replace(',', '.'))), 'Ungültige Sortierung')

export const staticDatasetCategoryCreateFormSchema = z
  .object({
    groupKey: staticDatasetCategorySegmentSchema,
    categoryKey: staticDatasetCategorySegmentSchema,
    sortOrder: sortOrderAsString,
    title: z.string().min(1).max(STATIC_DATASET_CATEGORY_TITLE_MAX),
    subtitle: z.string().max(STATIC_DATASET_CATEGORY_SUBTITLE_MAX),
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

export const staticDatasetCategoryEditFormSchema = z.object({
  groupKey: z.string().min(1),
  categoryKey: z.string().min(1),
  sortOrder: sortOrderAsString,
  title: z.string().min(1).max(STATIC_DATASET_CATEGORY_TITLE_MAX),
  subtitle: z.string().max(STATIC_DATASET_CATEGORY_SUBTITLE_MAX),
})

export type StaticDatasetCategoryCreateFormValues = z.infer<
  typeof staticDatasetCategoryCreateFormSchema
>
export type StaticDatasetCategoryEditFormValues = z.infer<
  typeof staticDatasetCategoryEditFormSchema
>
