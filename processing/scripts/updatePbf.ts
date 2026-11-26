// Brings the downloaded Geofabrik PBF up to the latest minute with OSM changes from openstreetmap.fr.
// Started by refresh_osm_processing.sh before a processing run with SKIP_DOWNLOAD=1.
// Imports only constants: `utils/parameters` would require the full processing environment.
import { rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { $ } from 'bun'
import { OSM_DOWNLOAD_DIR, replicationMarkerPath } from '../constants/directories.const'

const REPLICATION_URL = 'https://download.openstreetmap.fr/replication/europe/germany/minute/'

const pbf = join(OSM_DOWNLOAD_DIR, basename(process.env.PROCESS_GEOFABRIK_DOWNLOAD_URL ?? ''))
const updating = pbf.replace(/\.osm\.pbf$/, '.updating.osm.pbf')

const headerValue = async (file: string, option: string) =>
  (await $`osmium fileinfo --no-progress --get header.option.${option} ${file}`.text()).trim()

if (!(await Bun.file(pbf).exists())) {
  console.error(`updatePbf: ${pbf} is missing, run a regular processing first.`)
  process.exit(1)
}
console.log(`updatePbf: ${pbf} has data until ${await headerValue(pbf, 'timestamp')}`)

// The Geofabrik header names the Geofabrik feed, so the first pass starts from the newest object in the file.
// Exit code 1 means changes are left (size limit or network error), so we continue a few times.
await rm(updating, { force: true })
let { exitCode } =
  await $`pyosmium-up-to-date --ignore-osmosis-headers --server ${REPLICATION_URL} -o ${updating} ${pbf}`.nothrow()
for (let pass = 0; pass < 5 && exitCode === 1; pass++) {
  ;({ exitCode } = await $`pyosmium-up-to-date --server ${REPLICATION_URL} ${updating}`.nothrow())
}
if (exitCode > 1) {
  console.error(`updatePbf: pyosmium-up-to-date failed with exit code ${exitCode}`)
  await rm(updating, { force: true })
  process.exit(1)
}

const timestamp = await headerValue(updating, 'osmosis_replication_timestamp')
// Written before the move so an updated file always has a marker.
await Bun.write(replicationMarkerPath(pbf), `data until ${timestamp}\n`)
await $`mv ${updating} ${pbf}`
console.log(`updatePbf: ${pbf} has data until ${timestamp}`)
