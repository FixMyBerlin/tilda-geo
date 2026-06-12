import { exportSidepathData } from '../topics/roads_bikelanes/pseudo_tags_sidepath/exportSidepathData'
import { logEnd, logStart } from '../utils/logging'

/** Optional work after Processing: Finished — does not affect the current run's output. */
export async function runAfterthoughts(fileChanged: boolean) {
  logStart('Processing: Afterthoughts')
  console.log(
    '[Afterthoughts] Afterthoughts is optional work for the next run (does not affect current output).',
  )

  await exportSidepathData(fileChanged)
  logEnd('Processing: Afterthoughts')
}
