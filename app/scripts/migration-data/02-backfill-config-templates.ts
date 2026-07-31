#!/usr/bin/env bun
import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
/**
 * Idempotent backfill: RegionConfigTemplate rows for all DB regions + frozen v2/configs archive.
 * Local: bun --env-file=../.env --env-file=../.env.local run migration-data:02-config-templates
 * Server (/srv): docker compose run --rm --no-deps --entrypoint bun app run migration-data:02-config-templates
 */
import { configs } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/configs'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import db from '@/server/db.server'
import { upsertRegionConfigTemplate } from '@/server/regions/regionConfigTemplates.server'

async function backfillCurrentRegions() {
  const regions = await db.region.findMany({ include: { categoryAssignments: true } })
  let count = 0
  for (const region of regions) {
    const categories = [...region.categoryAssignments]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((assignment) => assignment.categoryId) as MapDataCategoryId[]
    if (categories.length === 0) continue
    await upsertRegionConfigTemplate(categories)
    count++
    console.log(`  ✓ ${region.slug}`)
  }
  console.log(`Backfilled ${count} region templates.`)
}

async function backfillFrozenArchive() {
  const entries = Object.entries(configs)
  for (const [checksum, template] of entries) {
    await db.regionConfigTemplate.upsert({
      where: { checksum },
      create: { checksum, template: template as MapDataCategoryParam[] },
      update: {},
    })
  }
  console.log(`Backfilled ${entries.length} frozen archive templates.`)
}

async function main() {
  console.log('Backfilling RegionConfigTemplate from current regions…')
  await backfillCurrentRegions()
  console.log('Backfilling RegionConfigTemplate from frozen v2/configs archive…')
  await backfillFrozenArchive()
  console.log('Done.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
