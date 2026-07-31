import { getObjectBlob } from '@better-upload/server/helpers'
import invariant from 'tiny-invariant'
import type { z } from 'zod'
import { getConfiguredS3Client } from '@/server/s3Client.server'

/**
 * Fetches JSON data directly from S3 without compression for processing
 * This is separate from proxyS3Url which is optimized for client delivery
 * Validates the JSON against the provided Zod schema for type safety
 */
export async function fetchS3Json<T extends z.ZodTypeAny>(url: string, schema: T) {
  const { hostname, pathname } = new URL(url)

  const bucket = hostname.split('.')[0]
  invariant(bucket, 'Invalid S3 URL: could not parse bucket from hostname')
  const key = pathname.substring(1)

  try {
    const object = await getObjectBlob(getConfiguredS3Client(), { bucket, key })
    const jsonString = await object.blob.text()
    const rawData = JSON.parse(jsonString)
    return schema.parse(rawData)
  } catch (error) {
    console.error('Failed to fetch JSON from S3:', error)
    throw new Error(
      `Failed to fetch JSON from S3: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
