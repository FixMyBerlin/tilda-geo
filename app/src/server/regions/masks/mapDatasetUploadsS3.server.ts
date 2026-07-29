import { deleteObject, putObject } from '@better-upload/server/helpers'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { s3UploadEnvFolder } from '@/server/s3UploadEnvFolder.const'
import { s3VirtualHostedUrl } from '@/server/s3VirtualHostedUrl.server'

/** Upload a map-dataset file to S3 under `uploads/{env}/{uploadSlug}/{filename}`. */
export async function uploadMapDatasetToS3(input: {
  uploadSlug: string
  filename: string
  body: Buffer | Uint8Array | string
  contentType?: string
}) {
  const s3UploadFolder = s3UploadEnvFolder()
  const fileKey = `uploads/${s3UploadFolder}/${input.uploadSlug}/${input.filename}`
  const bucket = process.env.S3_BUCKET

  await putObject(getConfiguredS3Client(), {
    bucket,
    key: fileKey,
    body: typeof input.body === 'string' ? input.body : new Uint8Array(input.body),
    contentType: input.contentType ?? 'application/octet-stream',
  })

  return s3VirtualHostedUrl({ bucket, key: fileKey })
}

/** Best-effort delete; callers treat the DB row as source of truth. */
export async function deleteMapDatasetFromS3(uploadSlug: string, filename: string) {
  const key = mapDatasetUploadS3Key(uploadSlug, filename)
  try {
    await deleteObject(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      key,
    })
  } catch (error) {
    console.error('[deleteMapDatasetFromS3] S3 delete failed', key, error)
  }
}

function mapDatasetUploadS3Key(uploadSlug: string, filename: string) {
  return `uploads/${s3UploadEnvFolder()}/${uploadSlug}/${filename}`
}
