import { join } from 'node:path'
import { $ } from 'bun'
import { PSEUDO_TAGS_DATA } from '../../../constants/directories.const'
import { directoryHasChanged, updateDirectoryHash } from '../../../utils/hashing'
import { params } from '../../../utils/parameters'
import {
  getSkipUnchangedContext,
  roadsBikelanesSidepathDir,
  willSkipTopic,
} from '../../../utils/skipUnchanged'

/**
 * Export is_sidepath estimation to CSV from the current DB (previous run’s data).
 * Called at the beginning of the run, before processTopics overwrites source tables.
 * Writes PSEUDO_TAGS_DATA/is_sidepath_estimation.csv so Lua can use it during this run.
 * If tables don’t exist yet (first run / empty DB), we skip and continue; Lua will get no data.
 */
export async function exportSidepathData(fileChanged: boolean) {
  const sqlDir = join(import.meta.dir, 'sql')
  const runFile = join(sqlDir, 'run_is_sidepath_estimation.sql')
  const csvPath = join(PSEUDO_TAGS_DATA, 'is_sidepath_estimation.csv')

  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  const skipContext = await getSkipUnchangedContext(fileChanged)

  if (await willSkipTopic('roads_bikelanes', fileChanged, skipContext)) {
    const excludedByProcessOnlyTopics =
      params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes('roads_bikelanes')
    console.log(
      '[Pseudo Tags][Sidepath] ⏩ Skipping export. roads_bikelanes will not run.',
      excludedByProcessOnlyTopics
        ? `PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`
        : 'SKIP_UNCHANGED is active and topic code is unchanged.',
    )
    return
  }

  const csvExists = await Bun.file(csvPath).exists()
  const sidepathCodeChanged = await directoryHasChanged(roadsBikelanesSidepathDir)
  if (!fileChanged && !sidepathCodeChanged && csvExists) {
    console.log(
      '[Pseudo Tags][Sidepath] ⏩ Skipping export.',
      'OSM file and pseudo_tags_sidepath are unchanged; reusing existing CSV.',
      JSON.stringify({ csvPath }),
    )
    return
  }

  console.log(
    '[Pseudo Tags][Sidepath] Export is_sidepath estimation from current DB (roads, _roads_bikelanes_sidepath_source_paths from previous run)',
  )
  try {
    console.time('[Pseudo Tags][Sidepath] Export-Timer')
    // -q = suppress message, print errors
    await $`psql -q -v ON_ERROR_STOP=1 -v outfile=${csvPath} -f ${runFile}`
    console.timeEnd('[Pseudo Tags][Sidepath] Export-Timer')
    await updateDirectoryHash(roadsBikelanesSidepathDir)
  } catch (error) {
    console.warn('[Pseudo Tags][Sidepath] ERROR: is_sidepath export failed.', error)
  }
}
