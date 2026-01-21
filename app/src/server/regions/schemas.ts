import { RegionStatus } from '@prisma/client'
import { z } from 'zod'

export const RegionSchema = z.object({
  slug: z.string(),
  promoted: z.boolean(),
  status: z.nativeEnum(RegionStatus),
})

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')
export const RegionFormSchema = RegionSchema.omit({
  promoted: true,
  status: true,
}).merge(
  z.object({
    promoted: trueOrFalse,
    status: z.nativeEnum(RegionStatus),
  }),
)

export const DeleteRegionSchema = z.object({
  slug: z.string(),
})

export const ProcessingMetaDates = z.discriminatedUnion('status', [
  // Processing state: status is 'processing'
  z.object({
    status: z.literal('processing'),
    osm_data_from: z.null(),
    processing_started_at: z.date(),
    processing_completed_at: z.null(),
    qa_update_started_at: z.null(),
    qa_update_completed_at: z.null(),
    statistics_started_at: z.null(),
    statistics_completed_at: z.null(),
  }),
  // Postprocessing state: main processing done, async operations running
  z.object({
    status: z.literal('postprocessing'), // set in processing/index; the dates are separate
    osm_data_from: z.date(),
    processing_started_at: z.date(),
    processing_completed_at: z.date(),
    // Can be any combination of dates during this status
    qa_update_started_at: z.date().nullable(),
    qa_update_completed_at: z.date().nullable(),
    statistics_started_at: z.date().nullable(),
    statistics_completed_at: z.date().nullable(),
  }),
  // Completed state: status is 'processed'
  z.object({
    status: z.literal('processed'),
    osm_data_from: z.date(),
    processing_started_at: z.date(),
    processing_completed_at: z.date(),
    qa_update_started_at: z.date(),
    qa_update_completed_at: z.date().nullable(), // May be null if operation failed
    statistics_started_at: z.date(),
    statistics_completed_at: z.date().nullable(), // May be null if operation failed
  }),
])
export type ProcessingMetaDate = z.infer<typeof ProcessingMetaDates>
