import { sql } from 'bun'

export async function initializeSchemaData() {
  await sql`CREATE SCHEMA IF NOT EXISTS data`
  return true
}

export async function initializeCustomFunctionsDataTables() {
  return true
}
