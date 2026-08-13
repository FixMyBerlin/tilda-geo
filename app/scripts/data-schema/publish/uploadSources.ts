import type { S3Client } from '@aws-sdk/client-s3'
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath } from '@/server/dataSchema/dataSchemaLocalPaths'
import { putS3Json } from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec, type DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'

export async function loadLocalSpec(table: string) {
  const specFile = Bun.file(dataSchemaLocalSpecPath(table))
  if (!(await specFile.exists())) return null
  return parseDataSchemaSpec(await specFile.json(), table)
}

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
