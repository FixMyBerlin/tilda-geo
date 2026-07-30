import { z } from 'zod'

export const ProcessingMetaDates = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('processing'),
    osm_data_from: z.null(),
    processing_started_at: z.date(),
    processing_completed_at: z.null(),
    qa_update_started_at: z.null(),
    qa_update_completed_at: z.null(),
  }),
  z.object({
    status: z.literal('postprocessing'),
    osm_data_from: z.date(),
    processing_started_at: z.date(),
    processing_completed_at: z.date(),
    qa_update_started_at: z.date().nullable(),
    qa_update_completed_at: z.date().nullable(),
  }),
  z.object({
    status: z.literal('processed'),
    osm_data_from: z.date(),
    processing_started_at: z.date(),
    processing_completed_at: z.date(),
    qa_update_started_at: z.date(),
    qa_update_completed_at: z.date().nullable(),
  }),
])
export type ProcessingMetaDate = z.infer<typeof ProcessingMetaDates>
