import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'

/** Streaming SHA-256 of a file (hex). Safe for multi-GB dumps. */
export async function sha256File(filePath: string) {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  for await (const chunk of stream) {
    hash.update(chunk)
  }
  return hash.digest('hex')
}
