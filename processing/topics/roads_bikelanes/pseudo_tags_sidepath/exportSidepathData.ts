import { $ } from 'bun'
import { join } from 'node:path'
import { PSEUDO_TAGS_DATA } from '../../../constants/directories.const'

/**
 * Export is_sidepath estimation to CSV from the current DB (previous run’s data).
 * Called at the beginning of the run, before processTopics overwrites source tables.
 * Writes PSEUDO_TAGS_DATA/is_sidepath_estimation.csv so Lua can use it during this run.
 * If tables don’t exist yet (first run / empty DB), we skip and continue; Lua will get no data.
 */
export async function exportSidepathData() {
  const sqlDir = join(import.meta.dir, 'sql')
  const runFile = join(sqlDir, 'run_is_sidepath_estimation.sql')
  const csvPath = join(PSEUDO_TAGS_DATA, 'is_sidepath_estimation.csv')

  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  console.log(
    '[Pseudo Tags][Sidepath] Export is_sidepath estimation from current DB (roads, _roads_bikelanes_sidepath_source_paths from previous run)',
  )
  try {
    console.time('[Pseudo Tags][Sidepath] Export-Timer')
    // -q = suppress message, print errors
    await $`psql -q -v ON_ERROR_STOP=1 -v outfile=${csvPath} -f ${runFile}`
    console.timeEnd('[Pseudo Tags][Sidepath] Export-Timer')
  } catch (error) {
    console.warn('[Pseudo Tags][Sidepath] ERROR: is_sidepath export failed.', error)
  }
}
