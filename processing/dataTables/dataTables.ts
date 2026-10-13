import { join } from 'node:path'
import { $, sql } from 'bun'

export async function initializeSchemaData() {
  await sql`CREATE SCHEMA IF NOT EXISTS data`
  return true
}

export async function initializeCustomFunctionsDataTables() {
  // Shared by topic SQL and afterthoughts: measure (the share of a feature inside an area), then
  // QA, which builds on it.
  for (const file of ['../measure/measure_functions.sql', '../qa/qa_functions.sql']) {
    await $`psql -v ON_ERROR_STOP=1 -q -f ${join(import.meta.dir, file)}`
  }
  return true
}
