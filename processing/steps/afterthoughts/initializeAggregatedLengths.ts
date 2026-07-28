import { join } from 'node:path'
import { $ } from 'bun'

/** Empty shell table for app stats reads; afterthoughts populate rows after Processing: Finished. */
export async function initializeAggregatedLengthsTable() {
  const sqlFile = join(import.meta.dir, 'sql', 'initialize_aggregated_lengths.sql')
  await $`psql -v ON_ERROR_STOP=1 -f ${sqlFile}`
}
