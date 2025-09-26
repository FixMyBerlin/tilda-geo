import { $ } from 'bun'
import { join } from 'path'
import { OSM_DOWNLOAD_DIR } from '../constants/directories.const'
import { checkSkipDownload } from '../utils/checkSkipDownload'
import { debugWgetCommand } from '../utils/debugWget'
import { ensureOAuthReady, fallbackToPublicDownload, getAuthHeaders } from '../utils/oauth'
import { params } from '../utils/parameters'
import { readHashFromFile, writeHashForFile } from '../utils/persistentData'

/**
 * Get the full path to the downloaded file.
 * @returns full path to the file
 */
export const originalFilePath = (fileName: string) => join(OSM_DOWNLOAD_DIR, fileName)

/**
 * Wait for the given url to have fresh data as last modified.
 * Accepts data from today or data from yesterday if created after 20:00.
 * @returns true if the file has been updated with fresh data, false otherwise
 */
export async function waitForFreshData() {
  if (!params.waitForFreshData) {
    console.log('Download: ⏩ Skipping `waitForFreshData` due to `WAIT_FOR_FRESH_DATA=0`')
    return
  }

  const maxTries = 25 // ~8 hours (at 20 Min per try)
  const timeoutMinutes = 20
  const now = new Date()
  const todaysDate = now.toDateString()
  const yesterdaysDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()

  let tries = 0

  while (true) {
    // Ensure OAuth is ready before each iteration
    const cookieCheck = await ensureOAuthReady()

    // Debug logging for waitForFreshData wget command with redirect parameters
    debugWgetCommand(cookieCheck as any, 'waitForFreshData')

    const response = await fetch(params.pbfDownloadUrl, {
      method: 'HEAD',
      headers: getAuthHeaders(cookieCheck?.httpCookie),
    })
    const lastModified = response.headers.get('Last-Modified')
    if (!lastModified) {
      console.log('[WARN] Download: No Last-Modified header found, continuing with existing file')
      return false
    }

    const lastModifiedDate = new Date(lastModified)
    const lastModifiedDateString = lastModifiedDate.toDateString()

    // Check if data is fresh enough:
    // 1. Data from today is always accepted
    // 2. Data from yesterday is accepted only if created after 20:00
    const isFromToday = todaysDate === lastModifiedDateString
    const isFromYesterdayAfter8PM =
      yesterdaysDate === lastModifiedDateString && lastModifiedDate.getHours() >= 20
    const isFreshData = isFromToday || isFromYesterdayAfter8PM

    // Enhanced logging to show the new logic
    const log = {
      today: now.toISOString(),
      newFileLastModified: lastModifiedDate.toISOString(),
      isFromToday,
      isFromYesterdayAfter8PM,
      next: isFreshData ? 'process' : 'wait',
    }
    console.log(`Download: \`waitForFreshData\` try ${tries}: ${JSON.stringify(log, undefined, 0)}`)

    if (isFreshData) {
      return true
    }

    tries++
    // If we exceeded the maximum number of tries, return false and log to Synology
    if (tries >= maxTries) {
      console.log(
        '[ERROR] Download: Timeout exceeded while waiting for fresh data.',
        `Now using file from ${lastModifiedDate.toISOString()}`,
      )
      return false
    }

    // Wait for the timeout
    await new Promise((resolve) => setTimeout(resolve, timeoutMinutes * 1000 * 60))
  }
}

/**
 * Download the file from the configured url and save it to the disk.
 * When the files eTag is the same as the last download, the download will be skipped.
 */
export async function downloadFile() {
  const { fileName, fileExists, filePath, skipDownload } = await checkSkipDownload()
  if (skipDownload) {
    console.log('Download: ⏩ Skipping download because file exists and `SKIP_DOWNLOAD` is active')
    return { fileName, fileChanged: false }
  }

  // Ensure we have OAuth authentication if required and check if file has changed
  const cookieCheck = await ensureOAuthReady()
  const eTagResponse = await fetch(params.pbfDownloadUrl, {
    method: 'HEAD',
    headers: getAuthHeaders(cookieCheck?.httpCookie),
  })
  if (!eTagResponse.ok) {
    console.log(
      `Download: ⚠️ Failed to get ETag, HTTP ${eTagResponse.status}: ${eTagResponse.statusText}`,
      eTagResponse,
    )
  }
  const eTag = eTagResponse.headers.get('ETag')

  if (eTag && fileExists && eTag === (await readHashFromFile(fileName))) {
    console.log('Download: ⏩ Skipped download because the file has not changed.')
    return { fileName, fileChanged: false }
  }

  if (!eTag) {
    console.log(
      'Download: ⚠️ No ETag found, will download file regardless of cache',
      JSON.stringify({ pbfDownloadUrl: params.pbfDownloadUrl, cookieCheck }),
    )
  }

  // Download file and write to disc
  const downloadMethod = cookieCheck?.isValid ? 'internal (OAuth)' : 'public'
  console.log(`Download: Downloading ${downloadMethod} ${params.pbfDownloadUrl}…`)

  // Debug logging for wget command with redirect parameters
  debugWgetCommand(cookieCheck as any, 'Download')

  try {
    if (cookieCheck?.isValid && cookieCheck.httpCookie) {
      // Try OAuth download first
      const result =
        await $`wget --quiet --header ${'Cookie: ' + cookieCheck.httpCookie} --output-document ${filePath} ${params.pbfDownloadUrl}`

      // Check if wget succeeded (exit code 0)
      if (result.exitCode !== 0) {
        console.warn(
          `[WARN] Download: OAuth download failed with exit code ${result.exitCode}, falling back to public download`,
        )

        // Fall back to public download
        fallbackToPublicDownload()
        console.log(`Download: Falling back to public download: ${params.pbfDownloadUrl}`)
        await $`wget --quiet --output-document ${filePath} ${params.pbfDownloadUrl}`
      }
    } else {
      // Public download
      await $`wget --quiet --output-document ${filePath} ${params.pbfDownloadUrl}`
    }
  } catch (error) {
    console.error(
      `[ERROR] Download: Failed to download ${downloadMethod} file: ${error}`,
      JSON.stringify(cookieCheck),
    )
    throw new Error(`Download: Failed to download ${downloadMethod} file: ${error}`)
  }

  // Save etag if available
  if (eTag) {
    writeHashForFile(fileName, eTag)
  }

  return { fileName, fileChanged: true }
}
