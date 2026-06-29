import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'

export async function unlinkExportFile(outputFilePath: string, logPrefix: string, reason: string) {
  try {
    await fs.unlink(outputFilePath)
  } catch (unlinkError) {
    console.warn(logPrefix, 'failed to remove temp export file', {
      outputFilePath,
      reason,
      unlinkError,
    })
  }
}

/**
 * Streams a finished export file to the client and removes the temp file once the
 * response is done (completed, failed or canceled). `onFinalized` runs after cleanup
 * so callers can drop additional state (e.g. a job registry entry).
 */
export function createExportFileResponseStream({
  outputFilePath,
  logPrefix,
  requestStartedAt,
  onFinalized,
}: {
  outputFilePath: string
  logPrefix: string
  requestStartedAt: number
  onFinalized?: (reason: string) => void
}) {
  const nodeStream = createReadStream(outputFilePath)
  let bytesStreamed = 0
  let didCleanup = false
  const cleanupFile = (reason: string) => {
    if (didCleanup) return
    didCleanup = true
    void unlinkExportFile(outputFilePath, logPrefix, reason).finally(() => onFinalized?.(reason))
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => {
        bytesStreamed += chunk.length
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on('end', () => {
        controller.close()
        console.info(logPrefix, 'stream completed', {
          bytesStreamed,
          totalDurationMs: Date.now() - requestStartedAt,
        })
        cleanupFile('stream_completed')
      })
      nodeStream.on('error', (streamError) => {
        console.error(logPrefix, 'stream failed', {
          bytesStreamed,
          totalDurationMs: Date.now() - requestStartedAt,
          streamError,
        })
        controller.error(streamError)
        cleanupFile('stream_failed')
      })
    },
    cancel(cancelReason) {
      nodeStream.destroy()
      console.warn(logPrefix, 'stream canceled by client', {
        bytesStreamed,
        totalDurationMs: Date.now() - requestStartedAt,
        cancelReason,
      })
      cleanupFile('stream_canceled')
    },
  })
}
