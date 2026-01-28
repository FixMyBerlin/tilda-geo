import { getOptimalCompression } from '@/scripts/StaticDatasets/updateStaticDatasets/getOptimalCompression'
import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3'
import { GetObjectCommandInput } from '@aws-sdk/client-s3/dist-types/commands/GetObjectCommand'

/**
 * Proxies S3 URLs with optimal compression and caching headers.
 * See docs/Uploads.md for details.
 */
export async function proxyS3Url(request: Request, url: string, downloadFilename?: string) {
  const { hostname, pathname } = new URL(url)
  const accessKeyId = process.env.S3_KEY!
  const secretAccessKey = process.env.S3_SECRET!
  const region = process.env.S3_REGION!

  const s3Client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  })

  const sendParams: GetObjectCommandInput = {
    Bucket: hostname.split('.')[0]!,
    Key: pathname.substring(1),
  }
  const range = request.headers.get('range')
  if (range !== null) sendParams.Range = range!

  // If-None-Match is an HTTP conditional request header that allows clients (browsers) to ask: "Only send me the file if it's different from what I already have."
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) {
    sendParams.IfNoneMatch = ifNoneMatch
  }

  let response: GetObjectCommandOutput
  try {
    response = await s3Client.send(new GetObjectCommand(sendParams))
  } catch (e) {
    const { $metadata, message } = e

    // Handle 304 Not Modified for conditional requests
    if ($metadata.httpStatusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
        },
      })
    }

    return Response.json(
      { source: 'S3', statusText: message },
      { status: $metadata.httpStatusCode },
    )
  }

  // @ts-expect-error
  let Body: Uint8Array<ArrayBuffer> = response.Body
  // @ts-expect-error
  const statusCode = response.Body.statusCode
  let { ContentLength, ContentType, ContentEncoding, ETag } = response

  if (url.endsWith('.geojson')) {
    ContentType = 'application/geo+json'
    const acceptEncoding = request.headers.get('accept-encoding')
    if (acceptEncoding && (acceptEncoding.includes('gzip') || acceptEncoding.includes('br'))) {
      const jsonString = await response.Body!.transformToString()
      const { compressed, contentEncoding } = getOptimalCompression(jsonString, acceptEncoding)
      Body = compressed
      ContentLength = compressed.length
      ContentEncoding = contentEncoding
    }
  }

  const headers: HeadersInit = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
    'Content-Length': String(ContentLength!),
    'Content-Type': ContentType!,
    ETag: ETag!, // S3 ETag for cache validation
    'Cache-Control': 'public, max-age=3600, must-revalidate', // 1 hour cache for both file types
    'Last-Modified': response.LastModified!.toUTCString(),
  }

  // Only add Content-Encoding if we actually compressed the content
  if (ContentEncoding && ContentEncoding !== 'identity') {
    headers['Content-Encoding'] = ContentEncoding
  }

  // Add download header if filename is provided
  if (downloadFilename) {
    headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"`
  }

  return new Response(Body, { status: statusCode, headers })
}
