import { z } from 'zod'
import {
  REGION_UPLOAD_ACCEPTED_MIME_TYPES,
  REGION_UPLOAD_MAX_FILE_SIZE_BYTES,
} from '@/server/regions/uploads/regionUploadImage.const'

/**
 * ~4/3 encoding + padding; data-URL prefixes stay under the small extra slack. Caps the decoded
 * buffer before `createRegionUploadFromBytes` allocates it; the exact byte check happens after.
 */
export const REGION_UPLOAD_CONTENT_BASE64_MAX_CHARS =
  Math.ceil((REGION_UPLOAD_MAX_FILE_SIZE_BYTES * 4) / 3) + 256

/** Shared by Bearer REST + MCP `region_uploads_create` (base64 file bytes in JSON). */
export const regionUploadFromBytesInputSchema = z.object({
  regionSlug: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.enum(REGION_UPLOAD_ACCEPTED_MIME_TYPES),
  contentBase64: z.string().min(1).max(REGION_UPLOAD_CONTENT_BASE64_MAX_CHARS),
})

export type RegionUploadFromBytesInput = z.infer<typeof regionUploadFromBytesInputSchema>
