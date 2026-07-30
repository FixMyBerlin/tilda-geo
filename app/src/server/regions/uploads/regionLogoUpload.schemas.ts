import { z } from 'zod'

/** Client → server metadata (`uploadAsync(..., { metadata })` / `clientMetadataSchema`). */
export const regionLogoClientMetadataSchema = z.object({
  regionSlug: z.string(),
  regionId: z.number(),
})

/** Server → client metadata (`onAfterSignedUrl` return / `onUploadComplete`). */
export const regionLogoResponseMetadataSchema = z.object({
  regionUploadId: z.number(),
  title: z.string(),
})
