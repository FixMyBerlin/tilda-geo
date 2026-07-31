import db from '@/server/db.server'

let cached: boolean | null = null

async function hasRegionsMigrationSchema() {
  const rows = await db.$queryRaw<{ ok: number }[]>`
    SELECT 1 AS ok
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Region'
      AND column_name = 'name'
    LIMIT 1
  `
  return rows.length > 0
}

/** True when local Postgres has the regions migration schema. False in CI, offline, or unmigrated dev DBs. */
export async function isIntegrationDbAvailable() {
  if (process.env.CI) return false
  if (cached != null) return cached
  try {
    await db.$queryRaw`SELECT 1`
    cached = await hasRegionsMigrationSchema()
  } catch {
    cached = false
  }
  return cached
}
