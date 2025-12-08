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
    processed_at: z.null(),
    osm_data_from: z.null(),
    processing_started_at: z.date(),
  }),
  // Completed state: status is 'processed'
  z.object({
    status: z.literal('processed'),
    processed_at: z.date(),
    osm_data_from: z.date(),
    processing_started_at: z.date(),
  }),
])
export type ProcessingMetaDate = z.infer<typeof ProcessingMetaDates>
