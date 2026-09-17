import { z } from 'zod'

/** Client → server metadata (`uploadAsync(..., { metadata })` / `clientMetadataSchema`). */
export const reviewListGeojsonClientMetadataSchema = z.object({
  regionSlug: z.string().min(1),
  listId: z.number().int().positive(),
})

/** Server → client metadata (`onAfterSignedUrl` return / `onUploadComplete`). */
export const reviewListGeojsonResponseMetadataSchema = z.object({
  regionSlug: z.string().min(1),
  listId: z.number().int().positive(),
  s3Key: z.string().min(1),
  filename: z.string().min(1),
})
