#!/usr/bin/env bun
import { RegionContractStatus } from '@/prisma/generated/browser'
/**
 * One-time migration: import region contracts (Aufträge) from regionContracts.const.ts into
 * PostgreSQL. Idempotent — upserts by slug, so it is safe to re-run.
 *
 * Local: bun --env-file=../.env --env-file=../.env.local run migration-data:03-contracts
 * Server (/srv): docker compose run --rm --no-deps --entrypoint bun app run migration-data:03-contracts
 *
 * Prerequisite: 01-regions-from-const.ts must have run first (all region slugs must exist).
 */
import { regionContracts } from '@/scripts/migration-data/regionContracts.const'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'

async function main() {
  console.log(`Migrating ${regionContracts.length} region contracts from regionContracts.const.ts…`)

  await runWithAuditContextAsync({ metadata: { changeSource: 'MIGRATION' } }, async () => {
    let migrated = 0

    for (const contract of regionContracts) {
      const status =
        contract.status === 'active' ? RegionContractStatus.ACTIVE : RegionContractStatus.INACTIVE

      await db.regionContract.upsert({
        where: { slug: contract.slug },
        create: {
          slug: contract.slug,
          name: contract.name,
          status,
          regions: { connect: contract.regionSlugs.map((slug) => ({ slug })) },
        },
        update: {
          name: contract.name,
          status,
          regions: { set: contract.regionSlugs.map((slug) => ({ slug })) },
        },
      })

      migrated++
      console.log(`  ✓ ${contract.slug} (${contract.regionSlugs.length} region(s))`)
    }

    console.log(`Done. Migrated ${migrated} contracts.`)
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
