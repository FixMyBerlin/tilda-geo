import { sql } from 'bun'

export async function initializeSchemaData() {
  await sql`CREATE SCHEMA IF NOT EXISTS data`
  return true
}

export async function initializeCustomFunctionsDataTables() {
  // Add custom SQL functions here when processing needs them in the database.
  return true
}
