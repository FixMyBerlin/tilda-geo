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
import { parseDataSchemaManifest } from './dataSchemaManifest.schema'
import {
  DATA_SCHEMA_S3_PREFIX,
  dataSchemaManifestKey,
  dataSchemaSnapshotManifestKey,
  dataSchemaSnapshotSpecKey,
  dataSchemaSnapshotsPrefix,
  dataSchemaSpecKey,
  parseDataSchemaSnapshotFolder,
  parseDataSchemaTableFolder,
} from './dataSchemaS3Keys'
import { parseDataSchemaSpecText } from './dataSchemaSpec.yaml'

function isS3NotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    error.name === 'S3Error' &&
    /^(NoSuchKey|NotFound) -/.test(error.message)
  )
}

export async function listDataSchemaTables() {
  const tables: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await listObjectsV2(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      prefix: `${DATA_SCHEMA_S3_PREFIX}/`,
      delimiter: '/',
      continuationToken,
    })
    for (const { prefix } of response.commonPrefixes) {
      if (!prefix) continue
      const table = parseDataSchemaTableFolder(prefix)
      if (table) tables.push(table)
    }
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined
  } while (continuationToken)
  return tables.sort()
}

export async function listDataSchemaSnapshotIds(table: string) {
  const prefix = dataSchemaSnapshotsPrefix(table)
  const ids: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await listObjectsV2(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      prefix,
      delimiter: '/',
      continuationToken,
    })
    for (const { prefix: commonPrefix } of response.commonPrefixes) {
      if (!commonPrefix) continue
      const id = parseDataSchemaSnapshotFolder(commonPrefix, table)
      if (id) ids.push(id)
    }
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined
  } while (continuationToken)
  return ids.sort().reverse()
}

export async function s3ObjectExists(key: string) {
  const listed = await listObjectsV2(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    prefix: key,
    maxKeys: 1,
  })
  return listed.contents[0]?.key === key
}

async function getS3ObjectTextIfExists(key: string) {
  try {
    const object = await getObjectBlob(getConfiguredS3Client(), {
      bucket: process.env.S3_BUCKET,
      key,
    })
    return await object.blob.text()
  } catch (error: unknown) {
    if (isS3NotFoundError(error)) return null
    throw error
  }
}

async function getS3ObjectJsonIfExists(key: string) {
  const text = await getS3ObjectTextIfExists(key)
  if (text == null) return null
  return JSON.parse(text) as unknown
}

export async function getDataSchemaSpecIfExists(table: string, snapshotId?: string | null) {
  const key = snapshotId ? dataSchemaSnapshotSpecKey(table, snapshotId) : dataSchemaSpecKey(table)
  const text = await getS3ObjectTextIfExists(key)
  if (text == null) return null
  return parseDataSchemaSpecText(text, table)
}

export async function getDataSchemaManifestIfExists(table: string, snapshotId?: string | null) {
  const key = snapshotId
    ? dataSchemaSnapshotManifestKey(table, snapshotId)
    : dataSchemaManifestKey(table)
  const json = await getS3ObjectJsonIfExists(key)
  if (json == null) return null
  return parseDataSchemaManifest(json, table)
}

export async function putS3Json(key: string, value: unknown) {
  await putObject(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    key,
    body: JSON.stringify(value, null, 2),
    contentType: 'application/json',
  })
}

export async function copyS3Object(fromKey: string, toKey: string) {
  await copyObject(getConfiguredS3Client(), {
    source: { bucket: process.env.S3_BUCKET, key: fromKey },
    destination: { bucket: process.env.S3_BUCKET, key: toKey },
  })
}

export async function putS3File(
  key: string,
  filePath: string,
  contentType = 'application/octet-stream',
) {
  const body = new Uint8Array(await readFile(filePath))
  await putObject(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    key,
    body,
    contentType,
    contentLength: body.byteLength,
  })
}

export async function downloadS3ObjectToFile(key: string, destPath: string) {
  const { stream } = await getObjectStream(getConfiguredS3Client(), {
    bucket: process.env.S3_BUCKET,
    key,
  })
  await mkdir(dirname(destPath), { recursive: true })
  await pipeline(Readable.fromWeb(stream as never), createWriteStream(destPath))
}
