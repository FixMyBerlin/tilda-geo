import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { TZDate } from '@date-fns/tz'
import { $ } from 'bun'
import { format, getHours, subDays } from 'date-fns'
import { OSM_DOWNLOAD_DIR, replicationMarkerPath } from '../constants/directories.const'
import { applyOsmChanges } from '../utils/applyOsmChanges'
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

/** Consumes the marker of `utils/applyOsmChanges.ts`, so the file counts as changed exactly once. */
async function takeReplicationMarker(fileName: string) {
  const marker = Bun.file(replicationMarkerPath(originalFilePath(fileName)))
  if (!(await marker.exists())) return false
  console.log(`Download: File was updated with OSM changes (${(await marker.text()).trim()})`)
  await marker.delete()
  return true
}

/**
 * HEAD request to the download URL that retries network errors (e.g. a short `ECONNREFUSED` at Geofabrik).
 * HTTP error responses are returned as they are; only a failed connection is retried.
 */
async function headRequest(headers: Record<string, string>) {
  const maxAttempts = 3
  const retryMinutes = 2
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(params.pbfDownloadUrl, { method: 'HEAD', headers })
    } catch (error) {
      if (attempt >= maxAttempts) throw error
      console.log(
        `[WARN] Download: HEAD request failed (attempt ${attempt}/${maxAttempts}), retry in ${retryMinutes} min:`,
        error instanceof Error ? error.message : error,
      )
      await new Promise((resolve) => setTimeout(resolve, retryMinutes * 1000 * 60))
    }
  }
}

/**
 * Wait for the given url to have fresh data as last modified.
 * Accepts data from today or data from yesterday if created after 20:00.
 * @returns true for fresh data, false if none came (`updateStaleFile` covers that), undefined if waiting is off
 */
export async function waitForFreshData() {
  if (!params.waitForFreshData) {
    console.log('Download: ⏩ Skipping `waitForFreshData` due to `WAIT_FOR_FRESH_DATA=0`')
    return
  }

  // Check every 20 minutes for 2 hours, then `updateStaleFile` brings the existing file up to date.
  // The nightly run starts around 23:10 UTC (GitHub starts the 23:00 cron late), when the Geofabrik file is almost always there already.
  // A file that is not there after 2 hours did not come that night (production, Aug–Nov 2026).
  // 2 hours of waiting, the update (a few minutes) and the run (up to 3.5 hours) end before 06:00 Berlin time.
  const maxTries = 7
  const timeoutMinutes = 20

  // Use German timezone (Europe/Berlin) for all date comparisons
  const now = new Date()
  const todaysDateDE = format(new TZDate(now, 'Europe/Berlin'), 'yyyy-MM-dd')
  const yesterdaysDateDE = format(new TZDate(subDays(now, 1), 'Europe/Berlin'), 'yyyy-MM-dd')

  let tries = 0

  while (true) {
    // Ensure OAuth is ready before each iteration
    const cookieCheck = await ensureOAuthReady()

    // Debug logging for waitForFreshData wget command with redirect parameters
    debugWgetCommand(cookieCheck, 'waitForFreshData')

    let lastModified: string | null = null
    try {
      const response = await headRequest(getAuthHeaders(cookieCheck?.httpCookie))
      lastModified = response.headers.get('Last-Modified')
    } catch (error) {
      // Server unreachable: count it as a try and check again after the timeout below.
      console.log(
        `[WARN] Download: \`waitForFreshData\` try ${tries}: server unreachable:`,
        error instanceof Error ? error.message : error,
      )
      tries++
      if (tries >= maxTries) {
        console.log('[WARN] Download: Server unreachable while waiting for fresh data.')
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, timeoutMinutes * 1000 * 60))
      continue
    }
    if (!lastModified) {
      console.log('[WARN] Download: No Last-Modified header found, continuing with existing file')
      return false
    }

    const lastModifiedDate = new Date(lastModified)
    // Convert to Berlin timezone
    const lastModifiedDateDE = format(new TZDate(lastModifiedDate, 'Europe/Berlin'), 'yyyy-MM-dd')
    const lastModifiedHourDE = getHours(new TZDate(lastModifiedDate, 'Europe/Berlin'))

    // Check if data is fresh enough (all times in German timezone):
    // 1. Data from today is always accepted
    // 2. Data from yesterday is accepted only if created after 20:00 German time
    const isFromToday = todaysDateDE === lastModifiedDateDE
    const isFromYesterdayAfter8PM =
      yesterdaysDateDE === lastModifiedDateDE && lastModifiedHourDE >= 20
    const isFreshData = isFromToday || isFromYesterdayAfter8PM

    // Enhanced logging to show the new logic
    const log = {
      todayDE: todaysDateDE,
      yesterdayDE: yesterdaysDateDE,
      newFileLastModifiedDE: lastModifiedDateDE,
      newFileLastModifiedHourDE: lastModifiedHourDE,
      newFileLastModifiedUTC: lastModifiedDate.toISOString(),
      isFromToday,
      isFromYesterdayAfter8PM,
      next: isFreshData ? 'process' : 'wait',
    }
    console.log(`Download: \`waitForFreshData\` try ${tries}: ${JSON.stringify(log, undefined, 0)}`)

    if (isFreshData) {
      return true
    }

    tries++
    // If we exceeded the maximum number of tries, return false
    if (tries >= maxTries) {
      console.log(
        '[WARN] Download: Timeout exceeded while waiting for fresh data.',
        `Geofabrik file is from ${lastModifiedDate.toISOString()}`,
      )
      return false
    }

    // Wait for the timeout
    await new Promise((resolve) => setTimeout(resolve, timeoutMinutes * 1000 * 60))
  }
}

/**
 * Geofabrik has no fresh file: bring the file of `downloadFile` up to date with OSM changes.
 * Runs after the download, so a Geofabrik file that is not fresh but newer than ours is updated, not replaced.
 * A failed update is not fatal: the run continues with the file as it is.
 * @returns true if the file was updated
 */
export async function updateStaleFile(fileName: string) {
  const filePath = originalFilePath(fileName)
  if (!(await Bun.file(filePath).exists())) return false
  try {
    if (await applyOsmChanges(filePath)) return await takeReplicationMarker(fileName)
  } catch (error) {
    console.log('[WARN] Download: Updating the file with OSM changes failed:', error)
  }
  console.log('Download: Continuing with the file as it is')
  return false
}

/**
 * Download the file from the configured url and save it to the disk.
 * When the files eTag is the same as the last download, the download will be skipped.
 */
export async function downloadFile() {
  const { fileName, fileExists, filePath, skipDownload } = await checkSkipDownload()
  if (skipDownload) {
    console.log('Download: ⏩ Skipping download because file exists and `SKIP_DOWNLOAD` is active')
    return { fileName, fileChanged: await takeReplicationMarker(fileName) }
  }

  // Ensure we have OAuth authentication if required and check if file has changed
  const cookieCheck = await ensureOAuthReady()
  let eTagResponse: Response
  try {
    eTagResponse = await headRequest(getAuthHeaders(cookieCheck?.httpCookie))
  } catch (error) {
    if (!fileExists) throw error
    console.log('[WARN] Download: Server unreachable, continuing with the existing file:', error)
    return { fileName, fileChanged: await takeReplicationMarker(fileName) }
  }
  if (!eTagResponse.ok) {
    console.log(
      `Download: ⚠️ Failed to get ETag, HTTP ${eTagResponse.status}: ${eTagResponse.statusText}`,
      eTagResponse,
    )
  }
  const eTag = eTagResponse.headers.get('ETag')

  if (eTag && fileExists && eTag === (await readHashFromFile(fileName))) {
    console.log('Download: ⏩ Skipped download because the file has not changed.')
    return { fileName, fileChanged: await takeReplicationMarker(fileName) }
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
  debugWgetCommand(cookieCheck, 'Download')

  try {
    if (cookieCheck?.isValid && cookieCheck.httpCookie) {
      // Try OAuth download first
      const result =
        await $`wget --quiet --header ${`Cookie: ${cookieCheck.httpCookie}`} --output-document ${filePath} ${params.pbfDownloadUrl}`

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

  // The fresh download replaces any file `utils/applyOsmChanges.ts` had updated.
  await rm(replicationMarkerPath(filePath), { force: true })

  // Save etag if available
  if (eTag) {
    writeHashForFile(fileName, eTag)
  }

  return { fileName, fileChanged: true }
}
