import { $ } from 'bun'
import { join } from 'path'
import { OSM_DOWNLOAD_DIR } from '../constants/directories.const'
import { checkSkipDownload } from '../utils/checkSkipDownload'
import { ensureOAuthReady, fallbackToPublicDownload, getAuthHeaders } from '../utils/oauth'
import { params } from '../utils/parameters'
import { readHashFromFile, writeHashForFile } from '../utils/persistentData'

/**
 * Get the full path to the downloaded file.
 * @returns full path to the file
 */
export const originalFilePath = (fileName: string) => join(OSM_DOWNLOAD_DIR, fileName)

/**
 * Wait for the givien url to have todays date as last modified.
 * @returns true if the file has been updated today, false otherwise
 */
export async function waitForFreshData() {
  if (!params.waitForFreshData) {
    console.log('Download: ⏩ Skipping `waitForFreshData` due to `WAIT_FOR_FRESH_DATA=0`')
    return
  }

  const maxTries = 50 // ~10 hours (at 15 Min per try)
  const timeoutMinutes = 15
  const todaysDate = new Date().toDateString()
  let tries = 0

  while (true) {
    // Ensure OAuth is ready before each iteration
    const cookieCheck = await ensureOAuthReady()

    const response = await fetch(params.pbfDownloadUrl, {
      method: 'HEAD',
      headers: getAuthHeaders(cookieCheck?.httpCookie),
    })
    const lastModified = response.headers.get('Last-Modified')
    if (!lastModified) {
      console.log('[WARN] Download: No Last-Modified header found, continuing with existing file')
      return false
    }

    // Check if last modified date is today
    const log = {
      today: new Date().toISOString(),
      newFileLastModified: new Date(lastModified).toISOString(),
      next: todaysDate === new Date(lastModified).toDateString() ? 'process' : 'wait',
    }
    console.log(`Download: \`waitForFreshData\` try ${tries}: ${JSON.stringify(log, undefined, 0)}`)

    // Check if last modified date is today
    const lastModifiedDate = new Date(lastModified).toDateString()
    if (todaysDate === lastModifiedDate) {
      return true
    }

    tries++
    // If we exceeded the maximum number of tries, return false and log to Synology
    if (tries >= maxTries) {
      console.log(
        '[ERROR] Download: Timeout exceeded while waiting for fresh data.',
        `Now using file from ${new Date(lastModified).toISOString()}`,
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
