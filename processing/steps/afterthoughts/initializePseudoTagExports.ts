import { join } from 'node:path'
import { $ } from 'bun'

/** Empty shell tables for pseudo-tag API exports; afterthoughts populate rows after Processing: Finished. */
export async function initializePseudoTagExportsTables() {
  const sqlFile = join(import.meta.dir, 'sql', 'initialize_pseudo_tag_exports.sql')
  await $`psql -v ON_ERROR_STOP=1 -f ${sqlFile}`
}
