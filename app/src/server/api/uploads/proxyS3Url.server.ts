import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { GetObjectCommandInput } from '@aws-sdk/client-s3/dist-types/commands/GetObjectCommand'
import { getOptimalCompression } from '@/scripts/StaticDatasets/updateStaticDatasets/getOptimalCompression'
import { corsHeaders } from '@/server/api/util/cors'

function s3ErrorResponse(e: unknown) {
  const metadata =
    e && typeof e === 'object' && '$metadata' in e
      ? (e as { $metadata: { httpStatusCode?: number } }).$metadata
      : undefined
  const message = e instanceof Error ? e.message : String(e)

  // Handle 304 Not Modified for conditional requests
  if (metadata?.httpStatusCode === 304) {
    return new Response(null, { status: 304, headers: corsHeaders })
  }

  return Response.json(
    { source: 'S3', statusText: message },
    { status: metadata?.httpStatusCode ?? 500, headers: corsHeaders },
  )
}

/** The headers that GET and HEAD of a file have in common. */
function fileHeaders(file: { contentType?: string; etag?: string; lastModified?: Date }) {
  return {
    ...corsHeaders,
    'Content-Type': file.contentType ?? '',
    // Prevent MIME sniffing; the served Content-Type is partly upload-controlled (region logos).
    'X-Content-Type-Options': 'nosniff',
    ETag: file.etag ?? '', // S3 ETag for cache validation
    // 1 hour cache for both file types. The route makes it `private` for non-public uploads.
    'Cache-Control': 'public, max-age=3600, must-revalidate',
    ...(file.lastModified ? { 'Last-Modified': file.lastModified.toUTCString() } : {}),
  }
}

/**
 * Proxies S3 URLs with optimal compression and caching headers.
 * See docs/Uploads.md for details.
 */
export async function proxyS3Url(request: Request, url: string, downloadFilename?: string) {
  const { hostname, pathname } = new URL(url)
  const accessKeyId = process.env.S3_KEY
  const secretAccessKey = process.env.S3_SECRET
  const region = process.env.S3_REGION

  // Intentionally raw @aws-sdk/client-s3: Better Upload helpers lack IfNoneMatch (304 Not Modified)
  // and Range streaming support required for PMTiles partial reads.
  const s3Client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  })

  const sendParams: GetObjectCommandInput = {
    Bucket: hostname.split('.')[0],
    Key: pathname.substring(1),
  }
  const range = request.headers.get('range')
  if (range !== null) sendParams.Range = range

  // If-None-Match is an HTTP conditional request header that allows clients (browsers) to ask: "Only send me the file if it's different from what I already have."
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) {
    sendParams.IfNoneMatch = ifNoneMatch
  }

  // HEAD (e.g. an app checks for a new version by ETag / Last-Modified) must not transfer the file.
  if (request.method === 'HEAD') {
    try {
      const head = await s3Client.send(
        new HeadObjectCommand({
          Bucket: sendParams.Bucket,
          Key: sendParams.Key,
          IfNoneMatch: ifNoneMatch ?? undefined,
        }),
      )
      const isGeojson = url.endsWith('.geojson')
      return new Response(null, {
        status: 200,
        headers: {
          ...fileHeaders({
            contentType: isGeojson ? 'application/geo+json' : head.ContentType,
            etag: head.ETag,
            lastModified: head.LastModified,
          }),
          // The size of the stored file; a GET of a GeoJSON may send it compressed.
          ...(head.ContentLength !== undefined && !isGeojson
            ? { 'Content-Length': String(head.ContentLength) }
            : {}),
        },
      })
    } catch (e: unknown) {
      return s3ErrorResponse(e)
    }
  }

  let response: GetObjectCommandOutput
  try {
    response = await s3Client.send(new GetObjectCommand(sendParams))
  } catch (e: unknown) {
    return s3ErrorResponse(e)
  }

  // @ts-expect-error - S3 SDK Body type is complex and not fully typed
  let Body: Uint8Array<ArrayBuffer> = response.Body
  // @ts-expect-error - S3 SDK Body type is complex and not fully typed
  const statusCode = response.Body.statusCode
  const { ETag } = response
  let { ContentLength, ContentType, ContentEncoding } = response

  if (url.endsWith('.geojson')) {
    ContentType = 'application/geo+json'
    const acceptEncoding = request.headers.get('accept-encoding')
    if (acceptEncoding && (acceptEncoding.includes('gzip') || acceptEncoding.includes('br'))) {
      const jsonString = await response.Body?.transformToString()
      if (jsonString === undefined) throw new Error('S3 Body transformToString returned undefined')
      const { compressed, contentEncoding } = getOptimalCompression(jsonString, acceptEncoding)
      Body = compressed
      ContentLength = compressed.length
      ContentEncoding = contentEncoding
    }
  }

  const contentEncoding =
    ContentEncoding && ContentEncoding !== 'identity' ? ContentEncoding : undefined
  const headers: Record<string, string> = {
    ...fileHeaders({ contentType: ContentType, etag: ETag, lastModified: response.LastModified }),
    'Content-Length': String(ContentLength ?? 0),
    ...(contentEncoding ? { 'Content-Encoding': contentEncoding } : {}),
  }

  // Add download header if filename is provided
  if (downloadFilename) {
    headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"`
  }

  return new Response(Body, { status: statusCode ?? 200, headers })
}
