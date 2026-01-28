import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

/**
 * Determines the best compression method based on Accept-Encoding header
 * and returns the compressed data with appropriate headers.
 *
 * Brotli typically achieves 5-15% better compression than gzip for text/JSON data,
 * and is supported by ~96% of modern browsers.
 */
export function getOptimalCompression(data: string | Buffer, acceptEncoding: string | null = null) {
  const inputData = typeof data === 'string' ? Buffer.from(data) : data
  const originalSize = inputData.length

  // Check browser support from Accept-Encoding header
  const supportsBrotli = acceptEncoding?.includes('br') ?? false
  const supportsGzip = acceptEncoding?.includes('gzip') ?? false

  if (supportsBrotli) {
    // Use Brotli with quality 8 (sweet spot: great compression, still fast)
    const compressed = brotliCompressSync(inputData, {
      params: {
        // 0-11, 8 is optimal balance per https://www.peterbe.com/plog/brotli-compression-quality-comparison-in-the-real-world analysis
        [constants.BROTLI_PARAM_QUALITY]: 8,
        [constants.BROTLI_PARAM_SIZE_HINT]: originalSize,
      },
    })

    return {
      compressed: new Uint8Array(compressed),
      contentEncoding: 'br' as const,
    }
  } else if (supportsGzip) {
    // Fallback to Gzip
    const compressed = gzipSync(inputData)

    return {
      compressed: new Uint8Array(compressed),
      contentEncoding: 'gzip' as const,
    }
  } else {
    // No compression support
    return {
      compressed: new Uint8Array(inputData),
      contentEncoding: 'identity' as const,
    }
  }
}
