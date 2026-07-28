import { join } from 'node:path'
import { $ } from 'bun'
import { PSEUDO_TAGS_DATA } from '../../../constants/directories.const'
import type { Topic } from '../../../constants/topics.const'
import { afterthoughtSkipped } from '../../../steps/afterthoughts/types'
import { toIsoWindow } from '../../../steps/metadata'
import { directoryHasChanged, updateDirectoryHash } from '../../../utils/hashing'
import { logEnd, logStart } from '../../../utils/logging'
import { params } from '../../../utils/parameters'
import { roadsBikelanesSidepathDir } from '../../../utils/skipUnchanged'

const LOG_PREFIX = '[Afterthoughts][Sidepath]'

/**
 * Afterthought: export is_sidepath estimation to CSV from the current run's DB.
 * Called at the end of processing (after Processing: Finished).
 * Writes PSEUDO_TAGS_DATA/is_sidepath_estimation.csv for the next run's roads_bikelanes Lua import.
 * If tables don't exist yet (first run / empty DB), we warn and continue.
 */
export async function exportSidepathData(fileChanged: boolean, ranTopics: Set<Topic>) {
  const sqlDir = join(import.meta.dir, 'sql')
  const runFile = join(sqlDir, 'run_is_sidepath_estimation.sql')
  const csvPath = join(PSEUDO_TAGS_DATA, 'is_sidepath_estimation.csv')

  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  const csvExists = await Bun.file(csvPath).exists()
  const roadsBikelanesRan = ranTopics.has('roads_bikelanes')

  if (!roadsBikelanesRan) {
    if (csvExists) {
      const excludedByProcessOnlyTopics =
        params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes('roads_bikelanes')
      console.log(
        `${LOG_PREFIX} ⏩ Skipping — roads_bikelanes did not run; existing CSV will be used next run.`,
        excludedByProcessOnlyTopics
          ? `PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`
          : 'SKIP_UNCHANGED is active and topic code is unchanged.',
        JSON.stringify({ csvPath }),
      )
      return afterthoughtSkipped('roads_bikelanes_skipped')
    }

    console.log(
      `${LOG_PREFIX} roads_bikelanes did not run but no CSV exists for next run — exporting from current DB.`,
      params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes('roads_bikelanes')
        ? `PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`
        : 'SKIP_UNCHANGED is active and topic code is unchanged.',
    )
  }

  const sidepathCodeChanged = await directoryHasChanged(roadsBikelanesSidepathDir)
  if (!roadsBikelanesRan && !fileChanged && !sidepathCodeChanged && csvExists) {
    console.log(
      `${LOG_PREFIX} ⏩ Skipping — OSM file and pseudo_tags_sidepath are unchanged; reusing existing CSV.`,
      JSON.stringify({ csvPath }),
    )
    return afterthoughtSkipped('unchanged')
  }

  console.log(
    `${LOG_PREFIX} Exporting is_sidepath_estimation.csv for next run`,
    '(from roads, _roads_bikelanes_sidepath_source_paths in current DB)',
  )

  const start = new Date()
  try {
    logStart('Afterthoughts: Sidepath export')
    // -q = suppress message, print errors
    await $`psql -q -v ON_ERROR_STOP=1 -v outfile=${csvPath} -f ${runFile}`
    logEnd('Afterthoughts: Sidepath export')
    await updateDirectoryHash(roadsBikelanesSidepathDir)
    return toIsoWindow(start, new Date())
  } catch (error) {
    console.warn(`${LOG_PREFIX} WARN: is_sidepath export failed — continuing.`, error)
    return afterthoughtSkipped('failed')
  }
}
