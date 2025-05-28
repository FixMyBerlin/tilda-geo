import { $, sql } from 'bun'

export async function initializeSchemaData() {
  await sql`CREATE SCHEMA IF NOT EXISTS data`
  return true
}

export async function initializeCustomFunctionsDataTables() {
  await $`psql -q -f ./dataTables/copy_mapillary_coverage_tags.sql`
  await $`psql -q -f ./dataTables/delete_todos_lines_without_mapillary_coverage.sql`
  return true
}
