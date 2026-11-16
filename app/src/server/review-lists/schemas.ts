import { z } from 'zod'
import {
  DEFAULT_REVIEW_LIST_STATUS_STYLES,
  ReviewListStatusStylesSchema,
} from '@/shared/reviewLists/reviewListStatusStyles'

const ReviewListConfigSchema = z.object({
  name: z.string().trim().min(1),
  // Optional so MCP updates leave the styles unchanged; the admin form always sends them.
  statusStyles: ReviewListStatusStylesSchema.optional(),
  regionSlugs: z.array(z.string().min(1)).min(1, 'Mindestens eine Region auswählen'),
})

export type ReviewListConfigInput = z.infer<typeof ReviewListConfigSchema>

const ReviewListFormRawSchema = z.object({
  name: z.string().trim().min(1),
  statusStyles: ReviewListStatusStylesSchema,
  regionSlugs: z.array(z.string()),
})

export type ReviewListFormInput = z.input<typeof ReviewListFormRawSchema>

const ReviewListFormSchema = ReviewListFormRawSchema.transform((form): ReviewListConfigInput => ({
  name: form.name,
  statusStyles: form.statusStyles,
  regionSlugs: [...new Set(form.regionSlugs.filter(Boolean))],
})).pipe(ReviewListConfigSchema)

export const UpdateReviewListFormSchema = ReviewListFormSchema

export const DeleteReviewListSchema = z.object({
  id: z.number(),
})

export function reviewListConfigToFormValues(config: ReviewListConfigInput) {
  return {
    name: config.name,
    statusStyles: config.statusStyles ?? DEFAULT_REVIEW_LIST_STATUS_STYLES,
    regionSlugs: config.regionSlugs,
  }
}
