import type { AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { RegionNotFoundError } from '@/server/regions/regionWriteErrors.server'
import { createRegionUpload } from '@/server/regions/uploads/createRegionUpload.server'
import {
  regionUploadFromBytesInputSchema,
  type RegionUploadFromBytesInput,
} from '@/server/regions/uploads/regionUploadFromBytes.schema'
import { REGION_UPLOAD_MAX_FILE_SIZE_BYTES } from '@/server/regions/uploads/regionUploadImage.const'
import { assertRegionUploadBytes } from '@/server/regions/uploads/regionUploadSniff'
import { putRegionUploadS3Object } from '@/server/regions/uploads/regionUploadsS3.server'

/**
 * The schema caps `contentBase64` length, so the decoded buffer is bounded before this runs.
 * `Buffer.from(…, 'base64')` ignores invalid characters instead of throwing; a garbage payload
 * decodes to an empty/short buffer and fails the size or content checks below.
 */
function decodeContentBase64(contentBase64: string) {
  // Agents sometimes prefix data-URL headers; strip if present.
  const raw = contentBase64.includes(',')
    ? (contentBase64.split(',').pop() ?? contentBase64)
    : contentBase64
  return Buffer.from(raw, 'base64')
}

/**
 * Bearer/MCP path: validate → S3 put → RegionUpload library row.
 * Does NOT set headerLogoId / welcomeImageUploadId — attach via updateRegionConfig.
 */
export async function createRegionUploadFromBytes(
  rawInput: RegionUploadFromBytesInput,
  auditContext: AuditContext = { metadata: { changeSource: 'API' } },
) {
  const input = regionUploadFromBytesInputSchema.parse(rawInput)

  const region = await db.region.findUnique({
    where: { slug: input.regionSlug },
    select: { id: true, slug: true },
  })
  if (!region) {
    throw new RegionNotFoundError(input.regionSlug)
  }

  const body = decodeContentBase64(input.contentBase64)
  if (body.byteLength === 0) {
    throw new Error('Datei ist leer')
  }
  if (body.byteLength > REGION_UPLOAD_MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Datei zu groß (max ${REGION_UPLOAD_MAX_FILE_SIZE_BYTES} Bytes, erhalten ${body.byteLength})`,
    )
  }
  assertRegionUploadBytes(input.mimeType, body)

  const s3Key = await putRegionUploadS3Object({
    regionSlug: region.slug,
    uuid: crypto.randomUUID(),
    filename: input.filename,
    body,
    contentType: input.mimeType,
  })

  const created = await createRegionUpload(
    {
      regionId: region.id,
      s3Key,
      title: input.filename,
      mimeType: input.mimeType,
      fileSize: body.byteLength,
      createdById: auditContext.userId ?? null,
    },
    auditContext,
  )

  return {
    uploadId: created.id,
    title: created.title,
    mimeType: created.mimeType,
    fileSize: created.fileSize,
    regionSlug: region.slug,
  }
}
