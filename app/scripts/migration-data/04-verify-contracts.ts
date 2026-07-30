#!/usr/bin/env bun
/**
 * Post-migration verification for RegionContract import.
 * Local: bun --env-file=../.env --env-file=../.env.local run migration-data:04-verify-contracts
 * Server (/srv): docker compose run --rm --no-deps --entrypoint bun app run migration-data:04-verify-contracts
 */
import db from '@/server/db.server'

const EXPECTED_CONTRACT_COUNT = 1
const EXPECTED_ASSIGNED_REGIONS = 4
const EXPECTED_UNASSIGNED_REGIONS = 30
const BRANDENBURG_SLUG = 'brandenburg'
const BRANDENBURG_REGIONS = ['bb-beteiligung', 'bb-kampagne', 'bb-pg', 'bb-sg']

async function main() {
  const contractCount = await db.regionContract.count()
  console.log(`RegionContract count: ${contractCount} (expected ${EXPECTED_CONTRACT_COUNT})`)
  if (contractCount < EXPECTED_CONTRACT_COUNT) {
    throw new Error(`Expected at least ${EXPECTED_CONTRACT_COUNT} contracts`)
  }

  const assignedCount = await db.region.count({ where: { contractId: { not: null } } })
  console.log(`Regions with contractId: ${assignedCount} (expected ${EXPECTED_ASSIGNED_REGIONS})`)
  if (assignedCount < EXPECTED_ASSIGNED_REGIONS) {
    throw new Error(`Expected at least ${EXPECTED_ASSIGNED_REGIONS} assigned regions`)
  }

  const unassigned = await db.region.findMany({
    where: { contractId: null },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })
  console.log(`Unassigned regions: ${unassigned.length} (expected ${EXPECTED_UNASSIGNED_REGIONS})`)
  if (unassigned.length < EXPECTED_UNASSIGNED_REGIONS) {
    throw new Error(`Expected at least ${EXPECTED_UNASSIGNED_REGIONS} unassigned regions`)
  }

  const brandenburg = await db.regionContract.findUnique({
    where: { slug: BRANDENBURG_SLUG },
    include: { regions: { select: { slug: true }, orderBy: { slug: 'asc' } } },
  })
  if (!brandenburg) {
    throw new Error(`Contract not found: ${BRANDENBURG_SLUG}`)
  }
  const brandenburgSlugs = brandenburg.regions.map((r) => r.slug)
  console.log(`Brandenburg regions: ${brandenburgSlugs.join(', ')}`)
  for (const slug of BRANDENBURG_REGIONS) {
    if (!brandenburgSlugs.includes(slug)) {
      throw new Error(`Brandenburg missing region: ${slug}`)
    }
  }

  console.log('Verification passed.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
