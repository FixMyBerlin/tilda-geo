import type { S3Client } from '@aws-sdk/client-s3'
import { inheritLargeFromPreviousManifest } from './buildDataSchemaManifest'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import { getS3ObjectJson, s3ObjectExists } from './dataSchemaS3.server'
import { dataSchemaLatestManifestKey } from './dataSchemaS3Keys'

/**
 * When `override` is omitted, keep `large` from the existing latest/manifest.json
 * (default false only when there is no previous manifest).
 */
export async function resolveLargeForRepublish(
  client: S3Client,
  bucket: string,
  table: string,
  override: boolean | undefined,
) {
  if (override !== undefined) return override
  const latestManifestKey = dataSchemaLatestManifestKey(table)
  if (!(await s3ObjectExists(client, bucket, latestManifestKey))) {
    return inheritLargeFromPreviousManifest(null)
  }
  const raw = await getS3ObjectJson(client, bucket, latestManifestKey)
  const parsed = dataSchemaManifestSchema.safeParse(raw)
  return inheritLargeFromPreviousManifest(parsed.success ? parsed.data : null)
}
