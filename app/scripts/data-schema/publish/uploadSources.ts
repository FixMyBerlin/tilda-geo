import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { S3Client } from '@aws-sdk/client-s3'
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import { putS3FileMultipart, putS3Json } from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSourceFileKey, dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec, type DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'

const SOURCE_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024

export async function loadLocalSpec(table: string) {
  const localSpecPath = dataSchemaLocalSpecPath(table)
  if (!existsSync(localSpecPath)) return null

  const raw = await readFile(localSpecPath, 'utf8')
  const rawJson = JSON.parse(raw) as { large?: unknown }
  const spec = parseDataSchemaSpec(rawJson, table)
  const largeOverride = typeof rawJson.large === 'boolean' ? rawJson.large : undefined
  return { spec, raw, localSpecPath, largeOverride }
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

export async function uploadSourceFile(
  client: S3Client,
  bucket: string,
  table: string,
  sourceFile: string,
  force: boolean,
) {
  const localSource = dataSchemaLocalSourcePath(table, sourceFile)
  if (!existsSync(localSource)) {
    throw new Error(`Local source file not found: ${localSource}`)
  }
  const size = statSync(localSource).size
  if (size > SOURCE_UPLOAD_LIMIT_BYTES && !force) {
    throw new Error(
      `Source file is ${(size / (1024 * 1024)).toFixed(1)} MB (>100 MB). Pass --force to upload anyway.`,
    )
  }
  const sourceKey = dataSchemaSourceFileKey(table, sourceFile)
  await putS3FileMultipart(client, bucket, sourceKey, localSource)
  p.log.success(`Uploaded s3://${bucket}/${sourceKey} (${size.toLocaleString()} bytes)`)
  return sourceKey
}
