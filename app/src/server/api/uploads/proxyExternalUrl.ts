import fs from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import { z } from 'zod'
import type { MapDataSourceExternalRenderFormat } from '@/scripts/StaticDatasets/types'
import { getOptimalCompression } from '@/scripts/StaticDatasets/updateStaticDatasets/getOptimalCompression'
import { ifNoneMatchHasEtag } from '@/server/api/uploads/privateCaching.server'
import { corsHeaders } from '@/server/api/util/cors'

const CACHE_DIR = path.join(process.cwd(), 'public', 'temp', 'uploads-cache')

const CacheMetadataSchema = z.object({
  lastFetched: z.number(),
  ttl: z.number(),
  filename: z.string(),
  etag: z.string().optional(),
  sourceLastModified: z.string().optional(),
})

type CacheMetadata = z.infer<typeof CacheMetadataSchema>

function getCachedResponse(
  request: Request,
  metadata: CacheMetadata,
  format: MapDataSourceExternalRenderFormat,
) {
  const cachedFilePath = path.join(CACHE_DIR, metadata.filename)
  if (!fs.existsSync(cachedFilePath)) {
    return null
  }
  const fileStats = fs.statSync(cachedFilePath)
  // 304 and HEAD need no file content: the cached file is not read.
  const early = conditionalOrHeadResponse(
    request,
    format,
    metadata,
    fileStats.size,
    fileStats.mtime,
  )
  if (early) return early
  const fileBuffer = fs.readFileSync(cachedFilePath)
  return buildResponse(request, fileBuffer, format, metadata, fileStats.mtime)
}

/**
 * Proxies external URLs with file-based caching.
 * See docs/Uploads.md for details.
 */
export async function proxyExternalUrl(
  request: Request,
  externalUrl: string,
  cacheTtlSeconds: number,
  format: MapDataSourceExternalRenderFormat,
  slug: string,
) {
  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
  const metadataPath = path.join(CACHE_DIR, `${slug}-${format}.meta.json`)
  const now = Date.now()

  // Check if cache exists and is valid
  let existingMetadata: CacheMetadata | null = null
  if (fs.existsSync(metadataPath)) {
    try {
      const rawMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
      const metadata = CacheMetadataSchema.parse(rawMetadata)
      existingMetadata = metadata
      const age = now - metadata.lastFetched
      const cacheValid = age < metadata.ttl * 1000

      if (cacheValid) {
        const cachedResponse = getCachedResponse(request, metadata, format)
        if (cachedResponse) {
          return cachedResponse
        }
      }
    } catch (error) {
      console.error('Error reading cache metadata:', error)
    }
  }

  // Cache miss or expired - fetch from external URL
  // Use existing metadata for conditional headers (etag, last-modified)
  const fetchHeaders: HeadersInit = {}
  if (existingMetadata?.etag) {
    fetchHeaders['If-None-Match'] = existingMetadata.etag
  }
  if (existingMetadata?.sourceLastModified) {
    fetchHeaders['If-Modified-Since'] = new Date(existingMetadata.sourceLastModified).toUTCString()
  }

  let response: Response
  try {
    // Disable Next.js fetch cache to avoid 2MB limit
    // We use file-based caching instead (see CACHE_DIR)
    response = await fetch(externalUrl, {
      headers: fetchHeaders,
      cache: 'no-store', // Prevent Next.js from caching large responses
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json(
      { source: 'external', statusText: `Failed to fetch: ${message}` },
      { status: 500, headers: corsHeaders },
    )
  }

  // Handle 304 Not Modified
  if (response.status === 304 && existingMetadata) {
    const cachedResponse = getCachedResponse(request, existingMetadata, format)
    if (cachedResponse) {
      return cachedResponse
    }
  }

  if (!response.ok) {
    return Response.json(
      { source: 'external', statusText: response.statusText },
      { status: response.status, headers: corsHeaders },
    )
  }

  // Get response headers
  const etag = response.headers.get('etag') || undefined
  const lastModified = response.headers.get('last-modified')
  const dateHeader = response.headers.get('date')
  const sourceLastModified = lastModified
    ? new Date(lastModified).toISOString()
    : dateHeader
      ? new Date(dateHeader).toISOString()
      : undefined

  // Read response body
  const arrayBuffer = await response.arrayBuffer()
  let fileBuffer = Buffer.from(arrayBuffer)

  // Handle .gz decompression for GeoJSON
  if (format === 'geojson' && externalUrl.endsWith('.gz')) {
    try {
      fileBuffer = gunzipSync(fileBuffer)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return Response.json(
        { source: 'external', statusText: `Failed to decompress: ${message}` },
        { status: 500, headers: corsHeaders },
      )
    }
  }

  // Save to cache
  const timestamp = now
  const cacheFilename = `${slug}-${timestamp}.${format}`
  const newCacheFilePath = path.join(CACHE_DIR, cacheFilename)

  fs.writeFileSync(newCacheFilePath, fileBuffer)

  // Update metadata
  const newMetadata: CacheMetadata = {
    lastFetched: now,
    ttl: cacheTtlSeconds,
    filename: cacheFilename,
    etag,
    sourceLastModified,
  }
  fs.writeFileSync(metadataPath, JSON.stringify(newMetadata, null, 2))

  // Clean up old cache files (keep only the latest)
  if (existingMetadata?.filename && existingMetadata.filename !== cacheFilename) {
    const oldCacheFilePath = path.join(CACHE_DIR, existingMetadata.filename)
    if (fs.existsSync(oldCacheFilePath)) {
      try {
        fs.unlinkSync(oldCacheFilePath)
      } catch (error) {
        console.error(`Error deleting old cache file ${existingMetadata.filename}:`, error)
      }
    }
  }

  // Get file stats for mtime fallback
  const fileStats = fs.statSync(newCacheFilePath)

  const early = conditionalOrHeadResponse(
    request,
    format,
    newMetadata,
    fileBuffer.length,
    fileStats.mtime,
  )
  if (early) return early
  return buildResponse(request, fileBuffer, format, newMetadata, fileStats.mtime)
}

function lastModifiedOf(metadata: CacheMetadata, fileMtime: Date) {
  return metadata.sourceLastModified
    ? new Date(metadata.sourceLastModified).toUTCString()
    : fileMtime.toUTCString()
}

/**
 * `304` for a matching `If-None-Match` (only when the source sent an ETag), and the headers of
 * a `HEAD` without the body. The file is not read, compressed or sent. A GeoJSON `HEAD` has no
 * `Content-Length`, because a `GET` may send it compressed.
 */
function conditionalOrHeadResponse(
  request: Request,
  format: MapDataSourceExternalRenderFormat,
  metadata: CacheMetadata,
  fileSize: number,
  fileMtime: Date,
) {
  const headers = {
    ...corsHeaders,
    ...(metadata.etag && { ETag: metadata.etag }),
    'Cache-Control': `public, max-age=${metadata.ttl}, must-revalidate`,
    'Last-Modified': lastModifiedOf(metadata, fileMtime),
  }
  if (ifNoneMatchHasEtag(request, metadata.etag)) {
    return new Response(null, { status: 304, headers })
  }
  if (request.method !== 'HEAD') return null

  return new Response(null, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': format === 'geojson' ? 'application/geo+json' : 'application/x-protobuf',
      ...(format === 'pmtiles' && { 'Accept-Ranges': 'bytes', 'Content-Length': String(fileSize) }),
      'X-Data-Last-Fetched': new Date(metadata.lastFetched).toISOString(),
      ...(metadata.sourceLastModified && { 'X-Source-Last-Modified': metadata.sourceLastModified }),
    },
  })
}

function buildResponse(
  request: Request,
  fileBuffer: Buffer,
  format: 'geojson' | 'pmtiles',
  metadata: CacheMetadata,
  fileMtime: Date,
) {
  // Branch 1: PMTiles range request
  if (format === 'pmtiles') {
    const range = request.headers.get('range')
    if (range) {
      const rangeMatch = range.match(/bytes=(\d+)-(\d*)/)
      if (rangeMatch) {
        // oxlint-disable-next-line typescript/no-non-null-assertion -- first capture group (\d+) always matches when rangeMatch is truthy
        const start = parseInt(rangeMatch[1]!, 10)
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileBuffer.length - 1
        const bodyArray = new Uint8Array(fileBuffer)
        const chunk = new Uint8Array(bodyArray.subarray(start, end + 1))
        return new Response(chunk, {
          status: 206,
          headers: {
            ...corsHeaders,
            'Content-Range': `bytes ${start}-${end}/${fileBuffer.length}`,
            'Content-Length': String(chunk.length),
            'Content-Type': 'application/x-protobuf',
            'Accept-Ranges': 'bytes',
            ...(metadata.etag && { ETag: metadata.etag }),
            'Cache-Control': `public, max-age=${metadata.ttl}, must-revalidate`,
            'Last-Modified': lastModifiedOf(metadata, fileMtime),
          },
        })
      }
    }
  }

  // Branch 2: GeoJSON (with optional compression)
  // Branch 3: PMTiles full file
  let body = new Uint8Array(fileBuffer)
  let contentLength = fileBuffer.length
  let contentEncoding: string | undefined

  if (format === 'geojson') {
    const acceptEncoding = request.headers.get('accept-encoding')
    if (acceptEncoding && (acceptEncoding.includes('gzip') || acceptEncoding.includes('br'))) {
      const jsonString = fileBuffer.toString('utf-8')
      const { compressed, contentEncoding: encoding } = getOptimalCompression(
        jsonString,
        acceptEncoding,
      )
      body = compressed
      contentLength = compressed.length
      contentEncoding = encoding
    }
  }

  const headers: HeadersInit = {
    ...corsHeaders,
    'Content-Length': String(contentLength),
    'Content-Type': format === 'geojson' ? 'application/geo+json' : 'application/x-protobuf',
    ...(format === 'pmtiles' && { 'Accept-Ranges': 'bytes' }),
    ...(metadata.etag && { ETag: metadata.etag }),
    'Cache-Control': `public, max-age=${metadata.ttl}, must-revalidate`,
    'Last-Modified': lastModifiedOf(metadata, fileMtime),
    'X-Data-Last-Fetched': new Date(metadata.lastFetched).toISOString(),
    ...(metadata.sourceLastModified && { 'X-Source-Last-Modified': metadata.sourceLastModified }),
    ...(contentEncoding &&
      contentEncoding !== 'identity' && { 'Content-Encoding': contentEncoding }),
  }

  return new Response(body, { status: 200, headers })
}
