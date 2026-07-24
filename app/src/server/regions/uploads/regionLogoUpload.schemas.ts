import { z } from 'zod'

/** Client → server metadata (`uploadAsync(..., { metadata })` / `clientMetadataSchema`). */
export const regionLogoClientMetadataSchema = z.object({
  regionSlug: z.string(),
  regionId: z.number(),
})

/** Intermediate metadata from `onBeforeUpload` → `onAfterSignedUrl` (`InterMetadata`). */
export type RegionLogoInterMetadata = {
  regionId: number
  title: string
  mimeType: string
  fileSize: number
  createdById: string
  auditIpAddress?: string | null
  auditUserAgent?: string | null
}

/** Server → client metadata (`onAfterSignedUrl` return / `onUploadComplete`). */
export const regionLogoResponseMetadataSchema = z.object({
  regionUploadId: z.number(),
  title: z.string(),
})
