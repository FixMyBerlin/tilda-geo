import { z } from 'zod'
import { fractionToPercent, percentToFraction } from '@/shared/qaThresholdPercent'

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

// The admin form shows/edits `goodThreshold`/`needsReviewThreshold` as a percent (e.g. 10 for
// 10 %) — easier to reason about than the raw 0–1 ratio. `QaConfig` keeps storing the fraction;
// this is the only place the percent <-> fraction conversion happens (see qaThresholdCalculations.ts,
// reused by the list table and the form's "Probe-Rechnung" preview).
const percentThresholdFromInput = z.coerce
  .number()
  .min(0, 'Wert darf nicht kleiner als 0 % sein.')
  .max(100, 'Wert darf nicht größer als 100 % sein.')
  .transform(percentToFraction)

/** „Gut bis“ darf nicht über „Überprüfung bis“ liegen — sonst gäbe es Werte, die keinem Status zugeordnet werden können. */
function requireGoodThresholdNotAboveNeedsReview(
  data: { goodThreshold: number; needsReviewThreshold: number },
  ctx: z.RefinementCtx,
) {
  if (data.goodThreshold > data.needsReviewThreshold) {
    ctx.addIssue({
      code: 'custom',
      path: ['needsReviewThreshold'],
      message: `„Überprüfung bis“ (${fractionToPercent(data.needsReviewThreshold)} %) muss mindestens so hoch sein wie „Gut bis“ (${fractionToPercent(data.goodThreshold)} %).`,
    })
  }
}

const CreateQaConfigObjectSchema = QaConfigSchema.omit({
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
  goodThreshold: percentThresholdFromInput,
  needsReviewThreshold: percentThresholdFromInput,
  absoluteDifferenceThreshold: z.coerce.number().int().min(0),
  mapAttribution: z
    .string()
    .optional()
    .transform((v) => v || null), // Convert empty/undefined to null for Prisma
  trustedOsmUsernames: trustedOsmUsernamesFromTextarea,
  referenceFrozenAt: referenceFrozenAtFromDateInput,
})

// Schema for creating QA configs
export const CreateQaConfigFormSchema = CreateQaConfigObjectSchema.superRefine(
  requireGoodThresholdNotAboveNeedsReview,
)

const UpdateQaConfigObjectSchema = CreateQaConfigObjectSchema.extend({
  id: z.coerce.number().int().positive('ID must be a valid positive integer'),
})

// Schema for updating QA configs (includes id)
export const UpdateQaConfigFormSchema = UpdateQaConfigObjectSchema.superRefine(
  requireGoodThresholdNotAboveNeedsReview,
)

export const GetQaConfigSchema = z.object({
  id: z.number(),
})

export const DeleteQaConfigSchema = z.object({
  id: z.number(),
})
