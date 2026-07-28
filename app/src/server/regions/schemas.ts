import { z } from 'zod'
import { RegionStatus } from '@/prisma/generated/browser'

const RegionSchema = z.object({
  slug: z.string(),
  promoted: z.boolean(),
  status: z.enum(RegionStatus),
})

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')
export const RegionFormSchema = RegionSchema.omit({
  promoted: true,
  status: true,
}).extend({
  promoted: trueOrFalse,
  status: z.enum(RegionStatus),
})

export const DeleteRegionSchema = z.object({
  slug: z.string(),
})

const processingMetaBase = {
  osm_data_from: z.date().nullable(),
  processing_started_at: z.date(),
  processing_completed_at: z.date().nullable(),
  qa_update_started_at: z.date().nullable(),
  qa_update_completed_at: z.date().nullable(),
}

export const ProcessingMetaDates = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('processing'),
    ...processingMetaBase,
    osm_data_from: z.null(),
    processing_completed_at: z.null(),
    qa_update_started_at: z.null(),
    qa_update_completed_at: z.null(),
  }),
  z.object({
    status: z.literal('postprocessing'),
    ...processingMetaBase,
    osm_data_from: z.date(),
    processing_completed_at: z.date(),
  }),
  z.object({
    status: z.literal('processed'),
    ...processingMetaBase,
    osm_data_from: z.date(),
    processing_completed_at: z.date(),
    qa_update_started_at: z.date(),
    qa_update_completed_at: z.date().nullable(),
  }),
])
export type ProcessingMetaDate = z.infer<typeof ProcessingMetaDates>
