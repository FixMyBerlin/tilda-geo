import type { Topic } from '../constants/topics.const'
import { exportSidepathData } from '../topics/roads_bikelanes/pseudo_tags_sidepath/exportSidepathData'
import { logEnd, logStart } from '../utils/logging'
import { aggregateLengths } from './afterthoughts/aggregateLengths'
import { recordAfterthought } from './metadata'

/**
 * Deferred work after Processing: Finished — statistics for current run, pseudo-tag CSVs for next run.
 *
 * To add an afterthought: write a function that returns an `AfterthoughtEntry` (a `{start,end}`
 * window or `afterthoughtSkipped(reason)`), then `recordAfterthought()` it here AND add its id to
 * processing/constants/afterthoughts.const.ts (+ the app mirror).
 */
export async function runAfterthoughts(
  processingId: number | null,
  fileChanged: boolean,
  ranTopics: Set<Topic>,
) {
  logStart('Processing: Afterthoughts')
  console.log(
    '[Afterthoughts] Deferred work (statistics for current run, pseudo-tag CSVs for next run).',
  )

  await recordAfterthought(processingId, 'statistics', await aggregateLengths())
  await recordAfterthought(
    processingId,
    'sidepath_export',
    await exportSidepathData(fileChanged, ranTopics),
  )

  logEnd('Processing: Afterthoughts')
}
