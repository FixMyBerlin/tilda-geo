#!/usr/bin/env bun
/**
 * One-time migration: import staticRegion config into PostgreSQL.
 * Local: bun --env-file=../.env --env-file=../.env.local run migration-data:01-regions
 * Server (/srv): docker compose run --rm --no-deps --entrypoint bun app run migration-data:01-regions
 *
 * Requires S3 credentials when any const region has a logo and no existing headerLogoId.
 */
import { constants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RegionStatus } from '@/prisma/generated/browser'
import { staticRegion } from '@/scripts/migration-data/regions.const'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { createRegionUpload } from '@/server/regions/uploads/createRegionUpload.server'
import { putRegionUploadS3Object } from '@/server/regions/uploads/regionUploadsS3.server'
import type { StaticRegion } from './staticRegion.types'
import { upsertRegionFromStatic } from './upsertRegionFromStatic'

function resolveLogoSourceAbsolute(logoPath: string) {
  if (logoPath.startsWith('file://')) {
    return fileURLToPath(logoPath)
  }
  if (path.isAbsolute(logoPath)) {
    return logoPath
  }
  if (logoPath.startsWith('/')) {
    return path.join(import.meta.dir, '../../public', logoPath)
  }
  return path.resolve(import.meta.dir, '../..', logoPath)
}

function logoFilenameFromSource(source: string) {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const urlPath = new URL(source).pathname
    const basename = path.basename(urlPath)
    return basename || 'logo'
  }
  return path.basename(source) || 'logo.svg'
}

function mimeTypeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

function constLogoSource(entry: StaticRegion) {
  if ('logoPath' in entry && entry.logoPath) return entry.logoPath
  if ('externalLogoPath' in entry && entry.externalLogoPath) return entry.externalLogoPath
  return null
}

async function readLocalLogoBytes(slug: string, logoPath: string) {
  const sourceAbsolute = resolveLogoSourceAbsolute(logoPath)
  try {
    await access(sourceAbsolute, constants.R_OK)
  } catch (error) {
    throw new Error(
      `Logo source not readable for region "${slug}": ${logoPath} (resolved: ${sourceAbsolute})`,
      { cause: error },
    )
  }
  return readFile(sourceAbsolute)
}

async function fetchExternalLogoBytes(slug: string, url: string) {
  // Wikimedia Commons rejects anonymous bots; other hosts ignore this header.
  const headers = {
    'User-Agent': 'tilda-geo-migration/1.0 (https://tilda-geo.de; regions logo import)',
  }
  const maxAttempts = 4
  let response: Response | undefined
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await fetch(url, { headers })
    } catch (error) {
      throw new Error(`Failed to fetch external logo for region "${slug}": ${url}`, {
        cause: error,
      })
    }
    if (response.status !== 429 || attempt === maxAttempts) break
    const retryAfterSec = Number(response.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfterSec) ? retryAfterSec * 1000 : 1000 * 2 ** (attempt - 1)
    console.warn(
      `  ⏳ ${slug}: HTTP 429 from ${url}; retry ${attempt}/${maxAttempts - 1} in ${waitMs}ms`,
    )
    await Bun.sleep(waitMs)
  }
  if (!response?.ok) {
    throw new Error(
      `Failed to fetch external logo for region "${slug}": ${url} (HTTP ${response?.status})`,
    )
  }
  const body = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
  return { body, contentType }
}

async function migrateLogoUpload(input: { regionId: number; slug: string; logoSource: string }) {
  const filename = logoFilenameFromSource(input.logoSource)
  const uuid = crypto.randomUUID()

  let body: Buffer
  let contentType = mimeTypeFromFilename(filename)

  if (input.logoSource.startsWith('http://') || input.logoSource.startsWith('https://')) {
    const fetched = await fetchExternalLogoBytes(input.slug, input.logoSource)
    body = fetched.body
    if (fetched.contentType) contentType = fetched.contentType
  } else {
    body = await readLocalLogoBytes(input.slug, input.logoSource)
  }

  const s3Key = await putRegionUploadS3Object({
    regionSlug: input.slug,
    uuid,
    filename,
    body,
    contentType,
  })

  const upload = await createRegionUpload(
    {
      regionId: input.regionId,
      s3Key,
      title: filename,
      mimeType: contentType,
      fileSize: body.byteLength,
      createdById: null,
    },
    { metadata: { changeSource: 'MIGRATION' } },
  )

  await runWithAuditContextAsync({ metadata: { changeSource: 'MIGRATION' } }, () =>
    db.region.update({
      where: { id: input.regionId },
      data: { headerLogoId: upload.id },
    }),
  )

  return upload.id
}

function assertS3CredentialsWhenNeeded(needsLogoUpload: boolean) {
  if (!needsLogoUpload) return
  const missing = ['S3_BUCKET', 'S3_KEY', 'S3_SECRET', 'S3_REGION', 'VITE_APP_ENV'].filter(
    (key) => !process.env[key],
  )
  if (missing.length > 0) {
    throw new Error(
      `S3 credentials required for logo migration but missing env: ${missing.join(', ')}`,
    )
  }
}

async function main() {
  console.log(`Migrating ${staticRegion.length} regions from regions.const.ts…`)

  let migrated = 0
  let assertedS3 = false
  for (const entry of staticRegion) {
    const dbRegion = await db.region.findUnique({ where: { slug: entry.slug } })
    const dbFields = {
      promoted: dbRegion?.promoted ?? false,
      status: dbRegion?.status ?? RegionStatus.PUBLIC,
      contractId: dbRegion?.contractId ?? null,
      headerLogoId: dbRegion?.headerLogoId ?? null,
    }

    await runWithAuditContextAsync({ metadata: { changeSource: 'MIGRATION' } }, () =>
      upsertRegionFromStatic(entry, dbFields, {
        metadata: { changeSource: 'MIGRATION' },
      }),
    )

    const region = await db.region.findUniqueOrThrow({
      where: { slug: entry.slug },
      select: { id: true, headerLogoId: true },
    })

    const logoSource = constLogoSource(entry)
    if (logoSource != null && region.headerLogoId == null) {
      if (!assertedS3) {
        assertS3CredentialsWhenNeeded(true)
        assertedS3 = true
      }
      const headerLogoId = await migrateLogoUpload({
        regionId: region.id,
        slug: entry.slug,
        logoSource,
      })
      console.log(`  ✓ ${entry.slug} (logo → RegionUpload #${headerLogoId})`)
    } else {
      console.log(`  ✓ ${entry.slug}`)
    }

    migrated++
  }

  console.log(`Done. Migrated ${migrated} regions.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
