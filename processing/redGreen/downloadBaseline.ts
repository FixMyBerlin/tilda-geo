import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { HASH_DIR } from '../constants/directories.const'
import { downloadFile, originalFilePath, waitForFreshData } from '../steps/download'
import type { RedGreenConfig } from './config'
import { copyFile } from './db'
import { runLogged } from './shell'

const RESEED_MARKER = join(HASH_DIR, 'red_green_last_reseed')

async function readReseedMarker() {
  try {
    return (await readFile(RESEED_MARKER, 'utf-8')).trim()
  } catch {
    return null
  }
}

async function writeReseedMarker(date: string) {
  await mkdir(HASH_DIR, { recursive: true })
  await writeFile(RESEED_MARKER, date)
}

async function workingPbfExists(workingPbfPath: string) {
  const file = Bun.file(workingPbfPath)
  return file.size > 0
}

export async function shouldReseedBaseline(workingPbfPath: string) {
  if (process.env.RED_GREEN_FORCE_RESEED === '1') {
    return true
  }
  if (!(await workingPbfExists(workingPbfPath))) {
    return true
  }

  const reseedHour = Number(process.env.RED_GREEN_RESEED_UTC_HOUR ?? '0')
  const now = new Date()
  if (now.getUTCHours() !== reseedHour) {
    return false
  }

  const today = now.toISOString().slice(0, 10)
  const lastReseed = await readReseedMarker()
  return lastReseed !== today
}

export async function downloadBaselineIfNeeded(config: RedGreenConfig) {
  if (!(await shouldReseedBaseline(config.workingPbfPath))) {
    console.log(`Baseline: keeping ${config.workingPbfPath} (intra-day pyosmium catch-up)`)
    return
  }

  console.log(`Baseline: reseeding ${config.workingPbfPath} from Geofabrik`)
  await waitForFreshData()
  const { fileName } = await downloadFile()
  const downloadedPath = originalFilePath(fileName)
  const targetPath = resolve(config.workingPbfPath)

  if (resolve(downloadedPath) !== targetPath) {
    await copyFile(downloadedPath, targetPath)
  }

  const today = new Date().toISOString().slice(0, 10)
  await writeReseedMarker(today)
  console.log(`Baseline: reseed complete (${basename(targetPath)}, marker ${today})`)
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Ensure the Germany clip polygon exists for `osmium extract --polygon`.
 *
 * Production recut should prefer a real polygon (germany.poly) over a bare bbox.
 * The polygon is public (no Geofabrik OAuth needed) and small, so we (re)download
 * it when RECUT_POLYGON_PATH is set and the file is missing, or on a forced reseed.
 * No-op when RECUT_POLYGON_PATH is unset (bbox fallback) or no download URL is given.
 */
export async function ensureRecutPolygon(config: RedGreenConfig) {
  if (!config.recutPolygonPath) {
    return
  }

  const exists = await fileExists(config.recutPolygonPath)
  const force = process.env.RED_GREEN_FORCE_RESEED === '1'
  if (exists && !force) {
    return
  }

  if (!config.recutPolygonDownloadUrl) {
    if (exists) {
      return
    }
    throw new Error(
      `RECUT_POLYGON_PATH is "${config.recutPolygonPath}" but the file is missing and ` +
        `RECUT_POLYGON_DOWNLOAD_URL is not set, so it cannot be bootstrapped.`,
    )
  }

  await mkdir(dirname(config.recutPolygonPath), { recursive: true })
  console.log(`Polygon: downloading clip polygon from ${config.recutPolygonDownloadUrl}`)
  await runLogged(`wget -q -O "${config.recutPolygonPath}" "${config.recutPolygonDownloadUrl}"`)
  console.log(`Polygon: ready at ${config.recutPolygonPath}`)
}
