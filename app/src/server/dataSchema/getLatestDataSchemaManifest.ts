import type { S3Client } from '@aws-sdk/client-s3'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import { getS3ObjectJson, s3ObjectExists } from './dataSchemaS3.server'
import { dataSchemaLatestManifestKey } from './dataSchemaS3Keys'

export async function getLatestDataSchemaManifest(client: S3Client, bucket: string, table: string) {
  const latestManifestKey = dataSchemaLatestManifestKey(table)
  if (!(await s3ObjectExists(client, bucket, latestManifestKey))) return null
  const raw = await getS3ObjectJson(client, bucket, latestManifestKey)
  const parsed = dataSchemaManifestSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}
