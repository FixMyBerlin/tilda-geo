import { deleteObject, getObjectBlob } from '@better-upload/server/helpers'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { s3UploadEnvFolder } from '@/server/s3UploadEnvFolder.const'

/**
 * Temporary GeoJSON uploads for Prüflisten imports live under:
 *
 *   review-list-uploads/{ENV}/{regionSlug}/{listId}/{uuid}/{filename}
 *
 * Objects are deleted after features are imported into ReviewEntry rows.
 */
const REVIEW_LIST_UPLOADS_PREFIX = 'review-list-uploads'

function sanitizeUploadFilename(filename: string) {
  const basename = filename.split(/[/\\]/).pop() ?? ''
  const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '')
  return cleaned || 'upload.geojson'
}

export function reviewListUploadKeyPrefix(input: { regionSlug: string; listId: number }) {
  return `${REVIEW_LIST_UPLOADS_PREFIX}/${s3UploadEnvFolder()}/${input.regionSlug}/${input.listId}/`
}

export function reviewListUploadKey(input: {
  regionSlug: string
  listId: number
  uuid: string
  filename: string
}) {
  const safeFilename = sanitizeUploadFilename(input.filename)
  return `${reviewListUploadKeyPrefix(input)}${input.uuid}/${safeFilename}`
}

export async function getReviewListUploadJson(s3Key: string) {
  const object = await getObjectBlob(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    key: s3Key,
  })
  const text = await object.blob.text()
  return JSON.parse(text) as unknown
}

/** Best-effort cleanup after import; DB rows are the source of truth. */
export async function deleteReviewListUploadS3Object(s3Key: string) {
  try {
    await deleteObject(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      key: s3Key,
    })
  } catch (error) {
    console.error('[deleteReviewListUploadS3Object] S3 delete failed', s3Key, error)
  }
}
