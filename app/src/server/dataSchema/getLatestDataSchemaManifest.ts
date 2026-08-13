import type { S3Client } from '@aws-sdk/client-s3'
import { assertManifestMatchesTable } from './buildDataSchemaManifest'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import { getS3ObjectJson, s3ObjectExists } from './dataSchemaS3.server'
import { dataSchemaLatestManifestKey } from './dataSchemaS3Keys'

export function parseLatestDataSchemaManifest(raw: unknown, table: string) {
  const parsed = dataSchemaManifestSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new Error(`Invalid latest manifest for "${table}": ${detail}`)
  }
  assertManifestMatchesTable(parsed.data, table)
  return parsed.data
}

export async function getLatestDataSchemaManifest(client: S3Client, bucket: string, table: string) {
  const latestManifestKey = dataSchemaLatestManifestKey(table)
  if (!(await s3ObjectExists(client, bucket, latestManifestKey))) return null
  return parseLatestDataSchemaManifest(
    await getS3ObjectJson(client, bucket, latestManifestKey),
    table,
  )
}
