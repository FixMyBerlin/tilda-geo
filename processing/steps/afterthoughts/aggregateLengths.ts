import { join } from 'node:path'
import { $ } from 'bun'
import { logEnd, logStart } from '../../utils/logging'
import {
  updateProcessingMetaStatisticsCompleted,
  updateProcessingMetaStatisticsStarted,
} from '../metadata'

const LOG_PREFIX = '[Afterthoughts][Statistics]'

/**
 * Afterthought: aggregate road and bikelane lengths per boundary into public.aggregated_lengths.
 * Called after Processing: Finished; feeds the app's /api/stats and region statistics UI.
 */
export async function aggregateLengths() {
  const sqlFile = join(import.meta.dir, 'sql', 'aggregate_lengths.sql')

  console.log(`${LOG_PREFIX} Aggregating road and bikelane lengths per boundary`)

  try {
    logStart('Afterthoughts: Statistics')
    await updateProcessingMetaStatisticsStarted()

    await $`psql -q -v ON_ERROR_STOP=1 -f ${sqlFile}`

    await updateProcessingMetaStatisticsCompleted()
    logEnd('Afterthoughts: Statistics')
  } catch (error) {
    console.warn(`${LOG_PREFIX} WARN: statistics aggregation failed — continuing.`, error)
  }
}
