#!/usr/bin/env bun
/**
 * One-time cutover: create MapDatasetUpload + S3 mask GeoJSON for every region
 * with mask config in the DB. Run after region import — config alone does not create uploads.
 *
 * Local: bun --env-file=../.env --env-file=../.env.local run migration-data-masks
 * Server (/srv): docker compose run --rm --no-deps --entrypoint bun app run migration-data-masks
 *
 * Requires DATABASE_*, S3_*, and geo DB (`boundaries` table with configured OSM relation IDs).
 */
import { styleText } from 'node:util'
import db from '@/server/db.server'
import { generateRegionMask } from '@/server/regions/masks/generateRegionMask.server'

async function main() {
  const regions = await db.region.findMany({
    where: {
      maskOsmRelationIds: { isEmpty: false },
    },
    orderBy: { slug: 'asc' },
    select: {
      slug: true,
      maskOsmRelationIds: true,
      maskBufferKm: true,
    },
  })

  if (regions.length === 0) {
    console.info(styleText('yellow', 'No regions with mask configuration found.'))
    return
  }

  console.log(`Updating masks for ${regions.length} region(s)…`)

  const failures: { slug: string; error: string }[] = []
  let successCount = 0

  for (const region of regions) {
    console.info(styleText(['inverse', 'bold'], 'PROCESSING'), region.slug)
    try {
      const result = await generateRegionMask({
        regionSlug: region.slug,
        maskOsmRelationIds: region.maskOsmRelationIds,
        maskBufferKm: region.maskBufferKm,
      })
      console.info(styleText('green', `✓ ${region.slug}`), result.mapRenderUrl)
      successCount += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(styleText('red', `✗ ${region.slug}`), message)
      failures.push({ slug: region.slug, error: message })
    }
  }

  console.info('')
  console.info(`Done: ${successCount} succeeded, ${failures.length} failed.`)

  if (failures.length > 0) {
    for (const { slug, error } of failures) {
      console.error(`  ${slug}: ${error}`)
    }
    throw new Error(`Mask update failed for ${failures.length} region(s)`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
