import { deleteObject } from '@better-upload/server/helpers'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { s3UploadEnvFolder } from '@/server/s3UploadEnvFolder.const'

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

/**
 * Sanitize a client-supplied file name before it becomes part of the S3 key. The raw `file.name`
 * is attacker-controlled and is interpolated into a URL that is later normalized by `new URL()`,
 * so an unsanitized `../../evil` would escape the `region-uploads/{env}/{slug}/{uuid}/` sandbox.
 * Keep only the basename, allow a safe character set, and strip leading dots (kills `..`).
 */
function sanitizeRegionUploadFilename(filename: string) {
  const basename = filename.split(/[/\\]/).pop() ?? ''
  const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '')
  return cleaned || 'file'
}

export function regionUploadKey(input: { regionSlug: string; uuid: string; filename: string }) {
  const safeFilename = sanitizeRegionUploadFilename(input.filename)
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
