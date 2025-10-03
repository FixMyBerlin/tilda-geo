import fs from 'node:fs'
import { gzipSync } from 'node:zlib'

/**
 * Checks if a file's compressed size is smaller than the specified threshold.
 *
 * Performance optimization: If the uncompressed file is larger than 30× the threshold,
 * it immediately returns false without compressing, since it's very unlikely to compress
 * down to under the threshold.
 *
 * @param filePath - Path to the file to check
 * @param maxCompressedSizeBites - Maximum compressed size in bytes (e.g., 50000 ≈ 50KB ≈ 0.05MB)
 * @returns Promise<boolean> - True if compressed size <= maxCompressedSizeBites
 */
export async function isCompressedSmallerThan(filePath: string, maxCompressedSizeBites: number) {
  const uncompressedSize = fs.statSync(filePath).size
  if (uncompressedSize > 30 * maxCompressedSizeBites) return false

  const compressedSize = gzipSync(fs.readFileSync(filePath)).length
  return compressedSize <= maxCompressedSizeBites
}
