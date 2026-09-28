import db from '@/server/db.server'

let cached: boolean | null = null

/**
 * True when local Postgres is reachable and has the regions schema. False in CI, offline, or
 * unmigrated dev DBs. Probes through the client so the check follows the Prisma schema (`Region`
 * lives in `prisma`, not `public`); the query fails on both an unreachable DB and a missing column.
 */
export async function isIntegrationDbAvailable() {
  if (process.env.CI) return false
  if (cached != null) return cached
  try {
    await db.region.findFirst({ select: { name: true } })
    cached = true
  } catch {
    cached = false
  }
  return cached
}
