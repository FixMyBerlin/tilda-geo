import { z } from 'zod'

export const RegionSchema = z.object({
  slug: z.string(),
  public: z.boolean(),
  exportPublic: z.boolean(),
})

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')
export const RegionFormSchema = RegionSchema.omit({ public: true, exportPublic: true }).merge(
  z.object({
    public: trueOrFalse,
    exportPublic: trueOrFalse,
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
