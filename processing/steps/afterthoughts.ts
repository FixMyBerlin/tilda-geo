import { exportSettlementAreaData } from '../topics/roads_bikelanes/pseudo_tags_settlement_area/exportSettlementAreaData'
import { exportSidepathData } from '../topics/roads_bikelanes/pseudo_tags_sidepath/exportSidepathData'
import { logEnd, logStart } from '../utils/logging'
import { getSkipUnchangedContext } from '../utils/skipUnchanged'
import { aggregateLengths } from './afterthoughts/aggregateLengths'

/** Deferred work after Processing: Finished — statistics for current run, pseudo-tag CSVs for next run. */
export async function runAfterthoughts(fileChanged: boolean) {
  logStart('Processing: Afterthoughts')
  console.log(
    '[Afterthoughts] Deferred work (statistics for current run, pseudo-tag CSVs for next run).',
  )

  await aggregateLengths()
  // Compute the skip-unchanged context once and share it across the pseudo-tag exports (each
  // call hashes helper/constants/dataTables, so computing it per export is redundant I/O).
  const skipContext = await getSkipUnchangedContext(fileChanged)
  await exportSidepathData(fileChanged, skipContext)
  await exportSettlementAreaData(fileChanged, skipContext)
  logEnd('Processing: Afterthoughts')
}
