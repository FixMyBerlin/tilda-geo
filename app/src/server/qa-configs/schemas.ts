import { z } from 'zod'
import { fractionToPercent, percentToFraction } from '@/shared/qaThresholdPercent'
import { qaDatasetKeySchema } from './qaDatasets.const'
import {
  type QaIndicator,
  qaIndicatorThresholdsSchema,
  qaIndicatorsSchema,
} from './schemas/qaIndicatorsSchema'

const qaSchemaQualifiedTableSchema = z
  .string()
  .regex(/^data\.[a-z_0-9]+$/, 'Muss im Format "data.tabellenname" sein')

// The map table processing writes to, and every `<map>_indicators` / `<map>_last_editors`
// companion table name is derived from (getQaTableName.ts) — always `public.*`.
const qaMapTableSchema = z
  .string()
  .regex(/^public\.[a-z_0-9]+$/, 'Muss im Format "public.tabellenname" sein')

const requiredText = (message: string) => z.string().trim().min(1, message)

/** Percent text as typed ("10") <-> the stored 0–1 fraction (0.1). */
const percentFieldCodec = z.codec(
  requiredText('Prozentwert ist erforderlich'),
  z
    .number()
    .min(0, 'Wert darf nicht kleiner als 0 % sein.')
    .max(1, 'Wert darf nicht größer als 100 % sein.'),
  {
    decode: (text) => percentToFraction(Number(text)),
    encode: (fraction) => String(fractionToPercent(fraction)),
  },
)

const numberFieldCodec = z.codec(requiredText('Absolute Toleranz ist erforderlich'), z.number(), {
  decode: (text) => Number(text),
  encode: (value) => String(value),
})

/** One indicator as the admin form edits it: thresholds as text, the relative ones in percent. */
const qaIndicatorDraftSchema = z.object({
  key: z.string().min(1, 'Merkmal auswählen'),
  label: requiredText('Label ist erforderlich'),
  goodThreshold: percentFieldCodec,
  needsReviewThreshold: percentFieldCodec,
  absoluteDifferenceThreshold: numberFieldCodec,
})

export type QaIndicatorDraft = z.input<typeof qaIndicatorDraftSchema>

/** A draft's thresholds, decoded and checked — input of the threshold preview. */
export const qaIndicatorDraftThresholdsSchema = qaIndicatorDraftSchema
  .pick({ goodThreshold: true, needsReviewThreshold: true, absoluteDifferenceThreshold: true })
  .pipe(qaIndicatorThresholdsSchema)

/** Stored indicators → form drafts (edit form defaults, dataset defaults). */
export const qaIndicatorsToDrafts = (indicators: readonly QaIndicator[]) =>
  indicators.map((indicator) => qaIndicatorDraftSchema.encode(indicator))

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

/** The admin form's field values → the `QaConfig` row. The server functions parse with it too. */
export const CreateQaConfigFormSchema = z.object({
  slug: z.string(),
  label: z.string(),
  isActive: trueOrFalse,
  mapTable: qaMapTableSchema,
  mapAttribution: z
    .string()
    .optional()
    .transform((v) => v || null), // Convert empty/undefined to null for Prisma
  dataset: qaDatasetKeySchema,
  areaTable: qaSchemaQualifiedTableSchema,
  areaFilter: z.enum(['all', 'priority', 'non_priority', 'with_reference']),
  referenceTable: qaSchemaQualifiedTableSchema,
  indicators: z.array(qaIndicatorDraftSchema).pipe(qaIndicatorsSchema),
  regionId: z.coerce.number().int().positive('Region ID must be a valid positive integer'),
  trustedOsmUsernames: trustedOsmUsernamesFromTextarea,
  referenceFrozenAt: referenceFrozenAtFromDateInput,
})

/** A stored config → the form's field values (edit form defaults, MCP round-trip). */
export const qaConfigToFormValues = (qaConfig: z.output<typeof CreateQaConfigFormSchema>) =>
  ({
    slug: qaConfig.slug,
    label: qaConfig.label,
    isActive: qaConfig.isActive ? 'true' : 'false',
    mapTable: qaConfig.mapTable,
    mapAttribution: qaConfig.mapAttribution ?? '',
    dataset: qaConfig.dataset,
    areaTable: qaConfig.areaTable,
    areaFilter: qaConfig.areaFilter,
    referenceTable: qaConfig.referenceTable,
    indicators: qaIndicatorsToDrafts(qaConfig.indicators),
    regionId: qaConfig.regionId.toString(),
    trustedOsmUsernames: qaConfig.trustedOsmUsernames.join('\n'),
    referenceFrozenAt: qaConfig.referenceFrozenAt.toISOString().slice(0, 10),
  }) satisfies z.input<typeof CreateQaConfigFormSchema>

export const UpdateQaConfigFormSchema = CreateQaConfigFormSchema.extend({
  id: z.coerce.number().int().positive('ID must be a valid positive integer'),
})

export const GetQaConfigSchema = z.object({
  id: z.number(),
})

export const DeleteQaConfigSchema = z.object({
  id: z.number(),
})
