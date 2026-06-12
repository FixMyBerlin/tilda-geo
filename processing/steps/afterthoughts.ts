import { exportSidepathData } from '../topics/roads_bikelanes/pseudo_tags_sidepath/exportSidepathData'
import { logEnd, logStart } from '../utils/logging'
import { aggregateLengths } from './afterthoughts/aggregateLengths'

/** Deferred work after Processing: Finished — statistics for current run, sidepath CSV for next run. */
export async function runAfterthoughts(fileChanged: boolean) {
  logStart('Processing: Afterthoughts')
  console.log(
    '[Afterthoughts] Deferred work (statistics for current run, sidepath CSV for next run).',
  )

  await aggregateLengths()
  await exportSidepathData(fileChanged)
  logEnd('Processing: Afterthoughts')
}
