import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { DATA_SCHEMA_S3_PREFIX } from './dataSchemaS3Keys'

function requireS3Env() {
  const accessKeyId = process.env.S3_KEY
  const secretAccessKey = process.env.S3_SECRET
  const region = process.env.S3_REGION
  const bucket = process.env.S3_BUCKET
  if (!accessKeyId || !secretAccessKey || !region || !bucket) {
    throw new Error('Missing S3_KEY, S3_SECRET, S3_REGION, or S3_BUCKET in environment.')
  }
  return { accessKeyId, secretAccessKey, region, bucket }
}

export function createDataSchemaS3Client() {
  const env = requireS3Env()
  return {
    client: new S3Client({
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
      region: env.region,
    }),
    bucket: env.bucket,
  }
}

export async function listDataSchemaTables(client: S3Client, bucket: string) {
  const tables: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${DATA_SCHEMA_S3_PREFIX}/`,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      }),
    )
    for (const prefix of response.CommonPrefixes ?? []) {
      const raw = prefix.Prefix
      if (!raw) continue
      const match = raw.match(new RegExp(`^${DATA_SCHEMA_S3_PREFIX}/([^/]+)/$`))
      if (match?.[1]) tables.push(match[1])
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)
  return tables.sort()
}

export async function listDataSchemaSnapshotIds(client: S3Client, bucket: string, table: string) {
  const prefix = `${DATA_SCHEMA_S3_PREFIX}/${table}/snapshots/`
  const ids: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      }),
    )
    for (const common of response.CommonPrefixes ?? []) {
      const raw = common.Prefix
      if (!raw) continue
      const match = raw.match(new RegExp(`^${prefix}(\\d{8}T\\d{4})/$`))
      if (match?.[1]) ids.push(match[1])
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)
  return ids.sort().reverse()
}

export async function s3ObjectExists(client: S3Client, bucket: string, key: string) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (error: unknown) {
    const status =
      error && typeof error === 'object' && '$metadata' in error
        ? (error as { $metadata: { httpStatusCode?: number } }).$metadata.httpStatusCode
        : undefined
    if (status === 404) return false
    const name = error instanceof Error ? error.name : ''
    if (name === 'NotFound' || name === 'NoSuchKey') return false
    throw error
  }
}

async function getS3ObjectBuffer(client: S3Client, bucket: string, key: string) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) {
    throw new Error(`S3 object has empty body: s3://${bucket}/${key}`)
  }
  return Buffer.from(await response.Body.transformToByteArray())
}

export async function getS3ObjectJson(client: S3Client, bucket: string, key: string) {
  const buffer = await getS3ObjectBuffer(client, bucket, key)
  return JSON.parse(buffer.toString('utf8')) as unknown
}

export async function putS3Json(client: S3Client, bucket: string, key: string, value: unknown) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json',
    }),
  )
}

export async function copyS3Object(
  client: S3Client,
  bucket: string,
  fromKey: string,
  toKey: string,
) {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fromKey}`,
      Key: toKey,
    }),
  )
}

export async function putS3FileMultipart(
  client: S3Client,
  bucket: string,
  key: string,
  filePath: string,
  contentType = 'application/octet-stream',
) {
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    },
  })
  await upload.done()
}

export async function downloadS3ObjectToFile(
  client: S3Client,
  bucket: string,
  key: string,
  destPath: string,
) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) {
    throw new Error(`S3 object has empty body: s3://${bucket}/${key}`)
  }
  await mkdir(dirname(destPath), { recursive: true })
  const body = response.Body
  const nodeStream =
    typeof (body as { transformToWebStream?: () => ReadableStream }).transformToWebStream ===
    'function'
      ? Readable.fromWeb(
          (body as { transformToWebStream: () => ReadableStream }).transformToWebStream() as never,
        )
      : (body as Readable)
  await pipeline(nodeStream, createWriteStream(destPath))
}
