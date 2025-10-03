import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * Fetches JSON data directly from S3 without compression for processing
 * This is separate from proxyS3Url which is optimized for client delivery
 */
export async function fetchS3Json(url: string): Promise<any> {
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
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to fetch JSON from S3:', error)
    throw new Error(`Failed to fetch JSON from S3: ${error.message}`)
  }
}
