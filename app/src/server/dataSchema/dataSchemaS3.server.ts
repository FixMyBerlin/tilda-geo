import { createWriteStream } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  copyObject,
  getObjectBlob,
  getObjectStream,
  listObjectsV2,
  putObject,
} from '@better-upload/server/helpers'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { DATA_SCHEMA_S3_PREFIX } from './dataSchemaS3Keys'

function dataSchemaS3() {
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw new Error('Missing S3_BUCKET in environment.')
  }
  return { client: getConfiguredS3Client(), bucket }
}

export function dataSchemaS3Bucket() {
  return dataSchemaS3().bucket
}

function isS3NotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    error.name === 'S3Error' &&
    /^(NoSuchKey|NotFound) -/.test(error.message)
  )
}

export async function listDataSchemaTables() {
  const { client, bucket } = dataSchemaS3()
  const tables: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await listObjectsV2(client, {
      bucket,
      prefix: `${DATA_SCHEMA_S3_PREFIX}/`,
      delimiter: '/',
      continuationToken,
    })
    for (const { prefix } of response.commonPrefixes) {
      if (!prefix) continue
      const match = prefix.match(new RegExp(`^${DATA_SCHEMA_S3_PREFIX}/([^/]+)/$`))
      if (match?.[1]) tables.push(match[1])
    }
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined
  } while (continuationToken)
  return tables.sort()
}

export async function listDataSchemaSnapshotIds(table: string) {
  const { client, bucket } = dataSchemaS3()
  const prefix = `${DATA_SCHEMA_S3_PREFIX}/${table}/snapshots/`
  const ids: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await listObjectsV2(client, {
      bucket,
      prefix,
      delimiter: '/',
      continuationToken,
    })
    for (const { prefix: commonPrefix } of response.commonPrefixes) {
      if (!commonPrefix) continue
      const match = commonPrefix.match(new RegExp(`^${prefix}(\\d{8}T\\d{4})/$`))
      if (match?.[1]) ids.push(match[1])
    }
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined
  } while (continuationToken)
  return ids.sort().reverse()
}

export async function s3ObjectExists(key: string) {
  const { client, bucket } = dataSchemaS3()
  const listed = await listObjectsV2(client, { bucket, prefix: key, maxKeys: 1 })
  return listed.contents[0]?.key === key
}

async function getS3ObjectJson(key: string) {
  const { client, bucket } = dataSchemaS3()
  const object = await getObjectBlob(client, { bucket, key })
  return JSON.parse(await object.blob.text()) as unknown
}

export async function getS3ObjectJsonIfExists(key: string) {
  try {
    return await getS3ObjectJson(key)
  } catch (error: unknown) {
    if (isS3NotFoundError(error)) return null
    throw error
  }
}

export async function putS3Json(key: string, value: unknown) {
  const { client, bucket } = dataSchemaS3()
  await putObject(client, {
    bucket,
    key,
    body: JSON.stringify(value, null, 2),
    contentType: 'application/json',
  })
}

export async function copyS3Object(fromKey: string, toKey: string) {
  const { client, bucket } = dataSchemaS3()
  await copyObject(client, {
    source: { bucket, key: fromKey },
    destination: { bucket, key: toKey },
  })
}

export async function putS3File(
  key: string,
  filePath: string,
  contentType = 'application/octet-stream',
) {
  const { client, bucket } = dataSchemaS3()
  const body = new Uint8Array(await readFile(filePath))
  await putObject(client, {
    bucket,
    key,
    body,
    contentType,
    contentLength: body.byteLength,
  })
}

export async function downloadS3ObjectToFile(key: string, destPath: string) {
  const { client, bucket } = dataSchemaS3()
  const { stream } = await getObjectStream(client, { bucket, key })
  await mkdir(dirname(destPath), { recursive: true })
  await pipeline(Readable.fromWeb(stream as never), createWriteStream(destPath))
}
