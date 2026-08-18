import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from '../../src/server/db.server'
import {
  regionInclude,
  regionRowToWriteInput,
} from '../../src/server/regions/regionConfigMapper.server'
import { updateRegionConfig } from '../../src/server/regions/regionWriteService.server'
import { createRegionUpload } from '../../src/server/regions/uploads/createRegionUpload.server'
import {
  putRegionUploadS3Object,
  regionUploadKey,
} from '../../src/server/regions/uploads/regionUploadsS3.server'
import {
  regionWelcomeDemoAssetFiles,
  regionWelcomeDemoImageSlugs,
  regionWelcomeDemoSpecToWriteInput,
  regionWelcomeDemoSpecs,
  regionWelcomeDemoUploadUuidBySlug,
  type RegionWelcomeDemoAssetId,
} from './regionWelcomeDemoContent'

const assetsDir = path.join(
  fileURLToPath(new URL('../../src/components/home/assets/HomePageProducts', import.meta.url)),
)

/**
 * Post-create step: welcome *text* is already in `regionSeedCatalog` fixtures.
 * Images cannot be set on create (RegionUpload needs regionId), so this attaches
 * demo hero uploads and updates those regions.
 */
async function upsertDemoRegionUpload(input: {
  regionId: number
  regionSlug: string
  assetId: RegionWelcomeDemoAssetId
}) {
  const asset = regionWelcomeDemoAssetFiles[input.assetId]
  const uuid =
    regionWelcomeDemoUploadUuidBySlug[
      input.regionSlug as keyof typeof regionWelcomeDemoUploadUuidBySlug
    ]
  if (!uuid) {
    throw new Error(`Kein Demo-Upload-UUID für Region ${input.regionSlug}`)
  }

  const s3Key = regionUploadKey({
    regionSlug: input.regionSlug,
    uuid,
    filename: asset.filename,
  })

  const existing = await db.regionUpload.findUnique({ where: { s3Key } })
  if (existing) return existing

  const filePath = path.join(assetsDir, asset.filename)
  const body = await readFile(filePath)

  try {
    await putRegionUploadS3Object({
      regionSlug: input.regionSlug,
      uuid,
      filename: asset.filename,
      body,
      contentType: asset.mimeType,
    })
  } catch (error) {
    console.warn(
      `[attachRegionWelcomeDemoImages] S3 upload failed for ${input.regionSlug} — welcome ohne Bild`,
      error,
    )
    return null
  }

  return createRegionUpload(
    {
      regionId: input.regionId,
      s3Key,
      title: asset.filename,
      mimeType: asset.mimeType,
      fileSize: body.byteLength,
      createdById: null,
    },
    { metadata: { changeSource: 'MIGRATION' } },
  )
}

export async function attachRegionWelcomeDemoImages() {
  for (const slug of regionWelcomeDemoImageSlugs) {
    const spec = regionWelcomeDemoSpecs[slug]
    const region = await db.region.findUnique({
      where: { slug },
      include: regionInclude,
    })
    if (!region) {
      console.warn(`[attachRegionWelcomeDemoImages] Region "${slug}" nicht gefunden — übersprungen`)
      continue
    }

    if (!spec.imageAsset) continue

    const upload = await upsertDemoRegionUpload({
      regionId: region.id,
      regionSlug: slug,
      assetId: spec.imageAsset,
    })
    if (!upload) continue

    const welcome = regionWelcomeDemoSpecToWriteInput(spec, upload.id)
    const baseConfig = regionRowToWriteInput(region)
    await updateRegionConfig(
      slug,
      { ...baseConfig, welcome },
      { metadata: { changeSource: 'MIGRATION' } },
    )
  }
}
