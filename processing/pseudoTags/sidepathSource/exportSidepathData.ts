import { $ } from 'bun'
import { join } from 'node:path'
import { PSEUDO_TAGS_DATA } from '../../constants/directories.const'

/**
 * Export is_sidepath estimation to CSV from the current DB (previous run’s data).
 * Called at the beginning of the run, before processTopics overwrites roads/roadsPathClasses.
 * Writes PSEUDO_TAGS_DATA/is_sidepath_estimation.csv so Lua can use it during this run.
 * If tables don’t exist yet (first run / empty DB), we skip and continue; Lua will get no data.
 */
export async function exportSidepathData() {
  const sqlDir = join(import.meta.dir, 'sql')
  const runFile = join(sqlDir, 'run_sidepath_estimation.sql')
  const csvPath = join(PSEUDO_TAGS_DATA, 'is_sidepath_estimation.csv')

  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  console.log(
    'Pseudo Tags: Exporting is_sidepath estimation from current DB (roads, roadsPathClasses from previous run)',
  )
  try {
    console.time('Export is_sidepath CSV')
    await $`psql -v ON_ERROR_STOP=1 -v paths_table=sidepath_paths_input -v roads_table=sidepath_roads_input -v format=is_sidepath_csv -v outfile=${csvPath} -f ${runFile}`
    console.timeEnd('Export is_sidepath CSV')
  } catch (error) {
    console.warn(
      `Pseudo Tags: Skipping is_sidepath export (tables roads/roadsPathClasses may not exist yet, e.g. first run). ${error}`,
    )
  }
}
