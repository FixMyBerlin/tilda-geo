import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { HASH_DIR } from '../constants/directories.const'
import type { RedGreenConfig } from './config'
import { runLogged } from './shell'

function pyosmiumCommand(config: RedGreenConfig) {
  // When we override --server (e.g. nightly Geofabrik baseline -> planet hourly
  // for intra-day catch-up) the PBF's baked-in osmosis replication headers point
  // at a different feed/sequence. --ignore-osmosis-headers makes pyosmium derive
  // the start sequence from the file timestamp against the new server instead.
  // https://docs.osmcode.org/pyosmium/latest/tools_uptodate.html
  if (config.replicationServerUrl) {
    return `pyosmium-up-to-date --ignore-osmosis-headers --server "${config.replicationServerUrl}" "${config.workingPbfPath}"`
  }
  return `pyosmium-up-to-date "${config.workingPbfPath}"`
}

async function writeReplicationCheckpoint(config: RedGreenConfig) {
  try {
    const info = await stat(config.workingPbfPath)
    await mkdir(HASH_DIR, { recursive: true })
    const checkpoint = join(HASH_DIR, `red_green_replication_${config.runId}.json`)
    await writeFile(
      checkpoint,
      `${JSON.stringify(
        {
          runId: config.runId,
          workingPbfPath: config.workingPbfPath,
          sizeBytes: info.size,
          mtime: info.mtime.toISOString(),
          replicationServerUrl: config.replicationServerUrl,
        },
        null,
        2,
      )}\n`,
    )
    console.log(
      `Replication checkpoint: ${config.workingPbfPath} is ${(info.size / 1024 / 1024).toFixed(1)} MB (mtime ${info.mtime.toISOString()})`,
    )
  } catch (error) {
    // Observability only — never fail the run because the checkpoint could not be written.
    console.warn(`[WARN] Could not write replication checkpoint`, error)
  }
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function replicateAndRecut(config: RedGreenConfig) {
  let status = 1
  let attempts = 0

  while (status === 1) {
    attempts += 1
    const result = await runLogged(pyosmiumCommand(config))
    status = result.exitCode
    if (status === 1) {
      await runLogged(`sleep ${config.replicationLoopSleepSeconds}`)
    } else if (status !== 0) {
      throw new Error(`pyosmium-up-to-date failed with exit code ${status} on attempt ${attempts}`)
    }
  }

  await writeReplicationCheckpoint(config)

  if (config.recutPolygonPath) {
    if (!(await fileExists(config.recutPolygonPath))) {
      throw new Error(
        `RECUT_POLYGON_PATH is set to "${config.recutPolygonPath}" but the file does not exist. ` +
          `Bootstrap it (downloadBaseline runs this) or unset RECUT_POLYGON_PATH to fall back to RECUT_BBOX.`,
      )
    }
    await mkdir(dirname(config.recutPbfPath), { recursive: true })
    await runLogged(
      `osmium extract --overwrite --strategy complete_ways --polygon "${config.recutPolygonPath}" -o "${config.recutPbfPath}" "${config.workingPbfPath}"`,
    )
    return
  }

  if (config.recutBbox) {
    await mkdir(dirname(config.recutPbfPath), { recursive: true })
    await runLogged(
      `osmium extract --overwrite --strategy complete_ways --bbox "${config.recutBbox}" -o "${config.recutPbfPath}" "${config.workingPbfPath}"`,
    )
    return
  }

  throw new Error('Missing recut definition. Set either RECUT_POLYGON_PATH or RECUT_BBOX.')
}
