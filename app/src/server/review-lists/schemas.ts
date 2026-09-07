import { z } from 'zod'

const ReviewListConfigSchema = z.object({
  name: z.string().trim().min(1),
  regionSlugs: z.array(z.string().min(1)).min(1, 'Mindestens eine Region auswählen'),
})

export type ReviewListConfigInput = z.infer<typeof ReviewListConfigSchema>

const ReviewListFormRawSchema = z.object({
  name: z.string().trim().min(1),
  regionSlugs: z.array(z.string()),
})

export type ReviewListFormInput = z.input<typeof ReviewListFormRawSchema>

const ReviewListFormSchema = ReviewListFormRawSchema.transform((form): ReviewListConfigInput => ({
  name: form.name,
  regionSlugs: [...new Set(form.regionSlugs.filter(Boolean))],
})).pipe(ReviewListConfigSchema)

export const UpdateReviewListFormSchema = ReviewListFormSchema

export const DeleteReviewListSchema = z.object({
  id: z.number(),
})

export function reviewListConfigToFormValues(config: ReviewListConfigInput) {
  return {
    name: config.name,
    regionSlugs: config.regionSlugs,
  }
}
