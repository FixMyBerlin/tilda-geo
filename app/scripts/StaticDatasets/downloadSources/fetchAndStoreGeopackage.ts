import type { WfsUrl } from './createWfsUrl'

const REQUEST_TIMEOUT_MS = 10 * 60 * 1000
const RETRY_BACKOFF_MS = [5_000, 15_000]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

export const fetchAndStoreGeopackage = async (wfsUrl: WfsUrl, geoPackageFilename: string) => {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    const isRetry = attempt > 0
    if (isRetry) {
      const waitMs = RETRY_BACKOFF_MS[attempt - 1] ?? 0
      console.log(
        `  Retry ${attempt}/${RETRY_BACKOFF_MS.length} in ${Math.round(waitMs / 1000)}s...`,
      )
      await sleep(waitMs)
    }

    const startedAt = performance.now()
    let timeout: ReturnType<typeof setTimeout> | undefined
    let heartbeat: ReturnType<typeof setInterval> | undefined
    try {
      const controller = new AbortController()
      timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      heartbeat = setInterval(() => {
        const elapsed = ((performance.now() - startedAt) / 1000).toFixed(0)
        console.log(`  Still downloading... ${elapsed}s`)
      }, 30_000)

      const response = await fetch(wfsUrl, {
        mode: 'cors',
        redirect: 'follow',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const contentLength = Number(response.headers.get('content-length') || 0)
      if (contentLength > 0) {
        console.log(`  Response size (header): ${formatMb(contentLength)}`)
      } else {
        console.log('  Response size (header): unknown')
      }

      const arrayBuffer = await response.arrayBuffer()
      await Bun.write(geoPackageFilename, new Uint8Array(arrayBuffer))

      const bytes = Bun.file(geoPackageFilename).size
      if (bytes > 0) {
        console.log(`  Response size (actual): ${formatMb(bytes)}`)
      } else {
        console.log('  Response size (actual): 0MB')
      }

      const elapsedMs = performance.now() - startedAt
      console.log(`  Download completed in ${(elapsedMs / 1000).toFixed(1)}s`)
      return geoPackageFilename
    } catch (error) {
      lastError = error
      const elapsedMs = performance.now() - startedAt
      const isAbortError = error instanceof Error && error.name === 'AbortError'
      console.log(
        `  Download attempt ${attempt + 1} failed after ${(elapsedMs / 1000).toFixed(1)}s${isAbortError ? ' (timeout)' : ''}.`,
      )
    } finally {
      if (timeout) clearTimeout(timeout)
      if (heartbeat) clearInterval(heartbeat)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to download geopackage')
}
