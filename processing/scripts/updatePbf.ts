// Brings the downloaded Geofabrik PBF up to the latest minute, see `utils/applyOsmChanges.ts`.
// Started by refresh_osm_processing.sh before a processing run with SKIP_DOWNLOAD=1.
import { basename, join } from 'node:path'
import { OSM_DOWNLOAD_DIR } from '../constants/directories.const'
import { applyOsmChanges } from '../utils/applyOsmChanges'

const pbf = join(OSM_DOWNLOAD_DIR, basename(process.env.PROCESS_GEOFABRIK_DOWNLOAD_URL ?? ''))

if (!(await Bun.file(pbf).exists())) {
  console.error(`updatePbf: ${pbf} is missing, run a regular processing first.`)
  process.exit(1)
}
if (!(await applyOsmChanges(pbf))) process.exit(1)
