import type { S3Client } from '@aws-sdk/client-s3'
import { s3ObjectExists } from './dataSchemaS3.server'
import {
  dataSchemaLatestDumpKey,
  dataSchemaObjectDumpKey,
  isDataSchemaSha256Hex,
} from './dataSchemaS3Keys'

/** Prefer the content-addressed dump; fall back to latest/table.dump for publishes from before objects/. */
export async function resolveLatestDataSchemaDumpKey(
  client: S3Client,
  bucket: string,
  table: string,
  sha256: string,
) {
  if (isDataSchemaSha256Hex(sha256)) {
    const objectKey = dataSchemaObjectDumpKey(table, sha256)
    if (await s3ObjectExists(client, bucket, objectKey)) return objectKey
  }
  return dataSchemaLatestDumpKey(table)
}
