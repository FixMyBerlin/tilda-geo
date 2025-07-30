import { z } from 'zod'

export const QaConfigSchema = z.object({
  id: z.number().optional(),
  slug: z.string(),
  label: z.string(),
  isActive: z.boolean(),
  mapTable: z.string(),
  goodThreshold: z.number().min(0).max(1),
  needsReviewThreshold: z.number().min(0).max(1),
  problematicThreshold: z.number().min(0).max(1),
  regionId: z.number(),
})

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')

export const QaConfigFormSchema = QaConfigSchema.omit({
  isActive: true,
  regionId: true,
  goodThreshold: true,
  needsReviewThreshold: true,
  problematicThreshold: true,
}).merge(
  z.object({
    isActive: trueOrFalse,
    regionId: z.string(),
    goodThreshold: z.coerce.number(),
    needsReviewThreshold: z.coerce.number(),
    problematicThreshold: z.coerce.number(),
  }),
)

export const GetQaConfigsSchema = z.object({
  regionId: z.number().optional(),
})

export const GetQaConfigSchema = z.object({
  id: z.number(),
})

export const DeleteQaConfigSchema = z.object({
  id: z.number(),
})
