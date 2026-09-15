import { z } from 'zod'

const QaConfigSchema = z.object({
  id: z.number().optional(),
  slug: z.string(),
  label: z.string(),
  isActive: z.boolean(),
  mapTable: z.string(),
  mapAttribution: z.string().optional(),
  goodThreshold: z.number().min(0).max(1),
  needsReviewThreshold: z.number().min(0).max(1),
  absoluteDifferenceThreshold: z.number().int().min(0),
  regionId: z.number(),
})

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')

// Textarea input (one OSM username per line) -> deduped, lowercased string[]; names are stored
// lowercase, one per user, so the nightly trusted-editor check is a plain lookup
const trustedOsmUsernamesFromTextarea = z.string().transform((value) => [
  ...new Set(
    value
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean),
  ),
])

// `date` input string (e.g. "2025-06-30") -> Date; a date-only ISO string parses as 00:00 UTC
const referenceFrozenAtFromDateInput = z.iso.date().transform((value) => new Date(value))

// Schema for creating QA configs
export const CreateQaConfigFormSchema = QaConfigSchema.omit({
  id: true,
  isActive: true,
  regionId: true,
  goodThreshold: true,
  needsReviewThreshold: true,
  absoluteDifferenceThreshold: true,
  mapAttribution: true,
}).extend({
  isActive: trueOrFalse,
  regionId: z.coerce.number().int().positive('Region ID must be a valid positive integer'),
  goodThreshold: z.coerce.number(),
  needsReviewThreshold: z.coerce.number(),
  absoluteDifferenceThreshold: z.coerce.number(),
  mapAttribution: z
    .string()
    .optional()
    .transform((v) => v || null), // Convert empty/undefined to null for Prisma
  trustedOsmUsernames: trustedOsmUsernamesFromTextarea,
  referenceFrozenAt: referenceFrozenAtFromDateInput,
})

// Schema for updating QA configs (includes id)
export const UpdateQaConfigFormSchema = CreateQaConfigFormSchema.extend({
  id: z.coerce.number().int().positive('ID must be a valid positive integer'),
})

export const GetQaConfigSchema = z.object({
  id: z.number(),
})

export const DeleteQaConfigSchema = z.object({
  id: z.number(),
})
