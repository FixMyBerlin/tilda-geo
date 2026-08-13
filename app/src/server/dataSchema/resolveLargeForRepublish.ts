import type { S3Client } from '@aws-sdk/client-s3'
import { inheritLargeFromPreviousManifest } from './buildDataSchemaManifest'
import { getLatestDataSchemaManifest } from './getLatestDataSchemaManifest'

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
  const previous = await getLatestDataSchemaManifest(client, bucket, table)
  return inheritLargeFromPreviousManifest(previous)
}
