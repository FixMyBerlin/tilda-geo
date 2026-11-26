// Imports only constants: `scripts/updatePbf.ts` runs without the full processing environment of `utils/parameters`.
import { rm } from 'node:fs/promises'
import { $ } from 'bun'
import { replicationMarkerPath } from '../constants/directories.const'

const REPLICATION_URL = 'https://download.openstreetmap.fr/replication/europe/germany/minute/'

const headerValue = async (file: string, option: string) =>
  (await $`osmium fileinfo --no-progress --get header.option.${option} ${file}`.text()).trim()

/**
 * Brings a downloaded Geofabrik PBF up to the latest minute with OSM changes from openstreetmap.fr
 * and writes the marker that makes `steps/download.ts` count the file as changed.
 * @returns false if the update failed; the file stays as it was
 */
export async function applyOsmChanges(pbf: string) {
  const updating = pbf.replace(/\.osm\.pbf$/, '.updating.osm.pbf')
  console.log(`applyOsmChanges: ${pbf} has data until ${await headerValue(pbf, 'timestamp')}`)

  // The Geofabrik header names the Geofabrik feed, so the first pass starts from the newest object in the file.
  // Exit code 1 means changes are left (size limit or network error), so we continue a few times
  // and then accept the file as far as it got.
  await rm(updating, { force: true })
  try {
    let { exitCode } =
      await $`pyosmium-up-to-date --ignore-osmosis-headers --server ${REPLICATION_URL} -o ${updating} ${pbf}`.nothrow()
    for (let pass = 0; pass < 5 && exitCode === 1; pass++) {
      ;({ exitCode } =
        await $`pyosmium-up-to-date --server ${REPLICATION_URL} ${updating}`.nothrow())
    }
    if (exitCode > 1) {
      console.error(`applyOsmChanges: pyosmium-up-to-date failed with exit code ${exitCode}`)
      return false
    }

    const timestamp = await headerValue(updating, 'osmosis_replication_timestamp')
    // Written before the move so an updated file always has a marker.
    await Bun.write(replicationMarkerPath(pbf), `data until ${timestamp}\n`)
    await $`mv ${updating} ${pbf}`
    console.log(`applyOsmChanges: ${pbf} has data until ${timestamp}`)
    return true
  } finally {
    await rm(updating, { force: true })
  }
}
