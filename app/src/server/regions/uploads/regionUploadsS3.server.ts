import { deleteObject, putObject } from '@better-upload/server/helpers'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { s3UploadEnvFolder } from '@/server/s3UploadEnvFolder.const'
import { sanitizeS3UploadFilename } from '@/server/sanitizeS3UploadFilename'

/**
 * Region uploads (logos, …) live in their OWN code-defined S3 key space, deliberately separate from
 * the static-datasets `uploads/…` path:
 *
 *   region-uploads/{ENV}/{regionSlug}/{uuid}/{filename}
 *
 * in the shared `S3_BUCKET`. The `{ENV}` segment is a **code constant** (not an env var), keyed off
 * `VITE_APP_ENV`, so dev/staging/prod uploads never collide.
 */
const REGION_UPLOADS_PREFIX = 'region-uploads'

export function regionUploadKey(input: { regionSlug: string; uuid: string; filename: string }) {
  const safeFilename = sanitizeS3UploadFilename(input.filename)
  return `${REGION_UPLOADS_PREFIX}/${s3UploadEnvFolder()}/${input.regionSlug}/${input.uuid}/${safeFilename}`
}

/** Best-effort delete; callers treat the DB row as source of truth. */
export async function deleteRegionUploadS3Object(s3Key: string) {
  try {
    await deleteObject(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      key: s3Key,
    })
  } catch (error) {
    console.error('[deleteRegionUploadS3Object] S3 delete failed', s3Key, error)
  }
}

/** Upload a region-upload file to S3 under `region-uploads/{env}/{regionSlug}/{uuid}/{filename}`. */
export async function putRegionUploadS3Object(input: {
  regionSlug: string
  uuid: string
  filename: string
  body: Buffer | Uint8Array | string
  contentType?: string
}) {
  const key = regionUploadKey({
    regionSlug: input.regionSlug,
    uuid: input.uuid,
    filename: input.filename,
  })
  await putObject(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    key,
    body: typeof input.body === 'string' ? input.body : new Uint8Array(input.body),
    contentType: input.contentType ?? 'application/octet-stream',
  })
  return key
}
