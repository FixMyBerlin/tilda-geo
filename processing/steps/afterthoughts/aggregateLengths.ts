import { join } from 'node:path'
import { $ } from 'bun'
import { logEnd, logStart } from '../../utils/logging'
import { toIsoWindow } from '../metadata'
import { afterthoughtSkipped } from './types'

const LOG_PREFIX = '[Afterthoughts][Statistics]'

/**
 * Afterthought: aggregate road and bikelane lengths per boundary into public.aggregated_lengths.
 * Called after Processing: Finished; feeds the app's /api/stats and region statistics UI.
 */
export async function aggregateLengths() {
  const sqlFile = join(import.meta.dir, 'sql', 'aggregate_lengths.sql')
  const start = new Date()

  try {
    logStart('Afterthoughts: Statistics')
    await $`psql -v ON_ERROR_STOP=1 -f ${sqlFile}`
    logEnd('Afterthoughts: Statistics')
    return toIsoWindow(start, new Date())
  } catch (error) {
    console.warn(`${LOG_PREFIX} WARN: aggregation failed — continuing.`, error)
    return afterthoughtSkipped('failed')
  }
}
