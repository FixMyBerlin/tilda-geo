import { join } from 'node:path'
import { $, sql } from 'bun'
import { PSEUDO_TAGS_DATA } from '../../../constants/directories.const'
import type { Topic } from '../../../constants/topics.const'
import { afterthoughtSkipped } from '../../../steps/afterthoughts/types'
import { toIsoWindow } from '../../../steps/metadata'
import { directoryHasChanged, updateDirectoryHash } from '../../../utils/hashing'
import { logEnd, logStart } from '../../../utils/logging'
import { params } from '../../../utils/parameters'
import { roadsBikelanesSettlementAreaDir } from '../../../utils/skipUnchanged'

const LOG_PREFIX = '[Afterthoughts][SettlementArea]'

/**
 * Afterthought: export the innerorts/außerorts estimation to CSV from the current run's DB.
 * Not wired in `processing/steps/afterthoughts.ts` until #3423 — kept for re-enable.
 *
 * Writes PSEUDO_TAGS_DATA/settlement_area_estimation.csv for the next run's roads_bikelanes Lua
 * import (sets `_in_settlement_area`). Mirrors exportSidepathData.
 *
 * Reads `public._settlement_areas`, which is produced separately and rarely by the weekend
 * `landcover` topic. If that table does not exist yet (fresh DB, landcover never run), we warn
 * and skip gracefully — the next run simply gets no `_in_settlement_area`.
 *
 * Skip-unchanged (for fast dev/staging reruns): when roads_bikelanes did not run, reuse the
 * existing CSV unless landcover ran (settlement polygons may have changed); and when the OSM
 * file and pseudo_tags_settlement_area/ are unchanged, reuse it too.
 */
export async function exportSettlementAreaData(fileChanged: boolean, ranTopics: Set<Topic>) {
  const runFile = join(import.meta.dir, 'sql', 'run_settlement_area_estimation.sql')
  const csvPath = join(PSEUDO_TAGS_DATA, 'settlement_area_estimation.csv')

  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  const csvExists = await Bun.file(csvPath).exists()
  const landcoverRan = ranTopics.has('landcover')
  const roadsBikelanesRan = ranTopics.has('roads_bikelanes')

  if (!roadsBikelanesRan) {
    if (csvExists && !landcoverRan) {
      console.log(
        `${LOG_PREFIX} ⏩ Skipping — roads_bikelanes did not run; existing CSV will be used next run.`,
        params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes('roads_bikelanes')
          ? `PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`
          : 'SKIP_UNCHANGED is active and topic code is unchanged.',
        JSON.stringify({ csvPath }),
      )
      return afterthoughtSkipped('roads_bikelanes_skipped')
    }
    if (!csvExists) {
      console.log(
        `${LOG_PREFIX} roads_bikelanes did not run but no CSV exists for next run — exporting from current DB.`,
      )
    } else if (landcoverRan) {
      console.log(
        `${LOG_PREFIX} landcover ran — re-exporting settlement_area_estimation.csv from updated _settlement_areas.`,
      )
    }
  }
  const settlementCodeChanged = await directoryHasChanged(roadsBikelanesSettlementAreaDir)
  if (!roadsBikelanesRan && !fileChanged && !settlementCodeChanged && !landcoverRan && csvExists) {
    console.log(
      `${LOG_PREFIX} ⏩ Skipping — OSM file and pseudo_tags_settlement_area are unchanged; reusing existing CSV.`,
      JSON.stringify({ csvPath }),
    )
    return afterthoughtSkipped('unchanged')
  }

  const [{ exists } = { exists: false }] = await sql`
    SELECT to_regclass('public._settlement_areas') IS NOT NULL AS exists
  `
  if (!exists) {
    console.warn(
      `${LOG_PREFIX} ⏩ Skipping — public._settlement_areas does not exist yet.`,
      'Run the weekend landcover topic (PROCESS_ONLY_TOPICS=landcover) to create it.',
    )
    return afterthoughtSkipped('no_settlement_areas_table')
  }

  console.log(
    `${LOG_PREFIX} Exporting settlement_area_estimation.csv for next run (from roads, bikelanes).`,
  )

  const start = new Date()
  try {
    logStart('Afterthoughts: Settlement-area export')
    await $`psql -q -v ON_ERROR_STOP=1 -v outfile=${csvPath} -f ${runFile}`
    logEnd('Afterthoughts: Settlement-area export')
    await updateDirectoryHash(roadsBikelanesSettlementAreaDir)
    return toIsoWindow(start, new Date())
  } catch (error) {
    console.warn(`${LOG_PREFIX} WARN: settlement-area export failed — continuing.`, error)
    return afterthoughtSkipped('failed')
  }
}
