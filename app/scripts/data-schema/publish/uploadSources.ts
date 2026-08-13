import type { S3Client } from '@aws-sdk/client-s3'
import * as p from '@clack/prompts'
import { putS3Json } from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'

export async function uploadSpecJson(
  client: S3Client,
  bucket: string,
  table: string,
  spec: DataSchemaSpec,
) {
  const specKey = dataSchemaSpecKey(table)
  await putS3Json(client, bucket, specKey, spec)
  p.log.success(`Uploaded s3://${bucket}/${specKey}`)
  return specKey
}
