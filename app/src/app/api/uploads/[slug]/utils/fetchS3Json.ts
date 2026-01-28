import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { z } from 'zod'

/**
 * Fetches JSON data directly from S3 without compression for processing
 * This is separate from proxyS3Url which is optimized for client delivery
 * Validates the JSON against the provided Zod schema for type safety
 */
export async function fetchS3Json<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
): Promise<z.infer<T>> {
  const { hostname, pathname } = new URL(url)
  const accessKeyId = process.env.S3_KEY!
  const secretAccessKey = process.env.S3_SECRET!
  const region = process.env.S3_REGION!

  const s3Client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  })

  const sendParams = {
    Bucket: hostname.split('.')[0]!,
    Key: pathname.substring(1),
  }

  try {
    const response = await s3Client.send(new GetObjectCommand(sendParams))

    if (!response.Body) {
      throw new Error('No response body from S3')
    }

    // Get the raw string without any compression
    const jsonString = await response.Body.transformToString()
    const rawData = JSON.parse(jsonString)
    return schema.parse(rawData)
  } catch (error) {
    console.error('Failed to fetch JSON from S3:', error)
    throw new Error(`Failed to fetch JSON from S3: ${error.message}`)
  }
}
