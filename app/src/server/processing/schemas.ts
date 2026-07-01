import { z } from 'zod'
import { afterthoughtSkipReasons } from '@/data/processingTypes/afterthoughts.const'

export const ProcessingMetaStatus = z.enum(['processing', 'postprocessing', 'processed'])

export const TopicPhaseWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
})

export const TopicSkipReasonSchema = z.enum(['weekend', 'unchanged', 'process_only_topics'])

export const TopicRanEntrySchema = z.object({
  lua: TopicPhaseWindowSchema.optional(),
  sql: TopicPhaseWindowSchema.optional(),
  diff: TopicPhaseWindowSchema.optional(),
})

export const TopicSkippedEntrySchema = z.object({
  skipped: TopicSkipReasonSchema,
})

export const TopicTimingEntrySchema = z.union([TopicRanEntrySchema, TopicSkippedEntrySchema])

export const ProcessingTopicsMetaSchema = z.record(z.string(), TopicTimingEntrySchema)

export const AfterthoughtSkipReasonSchema = z.enum(afterthoughtSkipReasons)

export const AfterthoughtSkippedEntrySchema = z.object({
  skipped: AfterthoughtSkipReasonSchema,
})

export const AfterthoughtEntrySchema = z.union([
  TopicPhaseWindowSchema,
  AfterthoughtSkippedEntrySchema,
])

export const ProcessingAfterthoughtsMetaSchema = z.record(z.string(), AfterthoughtEntrySchema)

export const isAfterthoughtSkipped = (
  entry: AfterthoughtEntry | undefined,
): entry is AfterthoughtSkippedEntry => entry !== undefined && 'skipped' in entry

/** Bun.SQL + JSON.stringify stored topics as a jsonb string scalar; unwrap for reads. */
const normalizeJsonbObjectInput = (value: unknown) => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return {}
  }
}

const normalizeTopicsMetaInput = normalizeJsonbObjectInput
const normalizeAfterthoughtsMetaInput = normalizeJsonbObjectInput

export const ProcessingRunRowSchema = z.object({
  id: z.number(),
  status: ProcessingMetaStatus,
  processing_duration: z.string().nullable(),
  osm_data_from: z.coerce.date().nullable(),
  processing_started_at: z.coerce.date(),
  processing_completed_at: z.coerce.date().nullable(),
  qa_update_started_at: z.coerce.date().nullable(),
  qa_update_completed_at: z.coerce.date().nullable(),
  topics: z.preprocess(normalizeTopicsMetaInput, ProcessingTopicsMetaSchema).catch({}),
  afterthoughts: z
    .preprocess(normalizeAfterthoughtsMetaInput, ProcessingAfterthoughtsMetaSchema)
    .catch({}),
})

export const parseProcessingRunRow = (row: unknown) => ProcessingRunRowSchema.safeParse(row)

export type ProcessingMetaStatus = z.infer<typeof ProcessingMetaStatus>
export type TopicPhaseWindow = z.infer<typeof TopicPhaseWindowSchema>
export type TopicSkipReason = z.infer<typeof TopicSkipReasonSchema>
export type TopicRanEntry = z.infer<typeof TopicRanEntrySchema>
export type TopicSkippedEntry = z.infer<typeof TopicSkippedEntrySchema>
export type TopicTimingEntry = z.infer<typeof TopicTimingEntrySchema>
export type ProcessingTopicsMeta = z.infer<typeof ProcessingTopicsMetaSchema>
export type AfterthoughtSkipReason = z.infer<typeof AfterthoughtSkipReasonSchema>
export type AfterthoughtSkippedEntry = z.infer<typeof AfterthoughtSkippedEntrySchema>
export type AfterthoughtEntry = z.infer<typeof AfterthoughtEntrySchema>
export type ProcessingAfterthoughtsMeta = z.infer<typeof ProcessingAfterthoughtsMetaSchema>
export type ProcessingRunRow = z.infer<typeof ProcessingRunRowSchema>
