import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { runWithAuditContextAsync, type AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { deleteRegionMaskUpload } from '@/server/regions/masks/generateRegionMask.server'
import {
  maskParamsEqual,
  RegionMaskSyncError,
  syncRegionMaskAfterWrite,
} from '@/server/regions/masks/syncRegionMaskAfterWrite.server'
import {
  regionWriteInputToCreateData,
  regionWriteInputToUpdateData,
  regionInclude,
  regionRowToClient,
} from '@/server/regions/regionConfigMapper.server'
import { upsertRegionConfigTemplate } from '@/server/regions/regionConfigTemplates.server'
import { RegionNotFoundError } from '@/server/regions/regionWriteErrors.server'
import {
  assertRegionCanBeDeleted,
  validateRegionConfigRelations,
} from '@/server/regions/regionWriteGuards.server'
import { RegionWriteSchema, type RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { deleteRegionUploadIfUnreferenced } from '@/server/regions/uploads/deleteRegionUploadIfUnreferenced.server'
import { deleteRegionUploadS3Object } from '@/server/regions/uploads/regionUploadsS3.server'

const DEFAULT_MASK = { maskOsmRelationIds: [] as number[], maskBufferKm: 10 }

async function syncMaskIfChanged(
  slug: string,
  previous: { maskOsmRelationIds: number[]; maskBufferKm: number },
  next: RegionWriteInput,
) {
  const desired = {
    maskOsmRelationIds: next.maskOsmRelationIds,
    maskBufferKm: next.maskBufferKm,
  }
  if (maskParamsEqual(previous, desired)) return

  try {
    await syncRegionMaskAfterWrite({ slug, ...desired })
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error)
    throw new RegionMaskSyncError(cause)
  }
}

export async function createRegionConfig(
  config: RegionWriteInput,
  auditContext: AuditContext = {},
) {
  const parsed = RegionWriteSchema.parse(config)
  await validateRegionConfigRelations(parsed)
  return runWithAuditContextAsync(auditContext, async () => {
    const createData = regionWriteInputToCreateData(parsed)
    await db.$transaction(async (tx) => {
      await tx.region.create({
        data: createData,
      })
      await upsertRegionConfigTemplate(parsed.categories as MapDataCategoryId[], tx)
    })

    await syncMaskIfChanged(parsed.slug, DEFAULT_MASK, parsed)

    const withMask = await db.region.findUniqueOrThrow({
      where: { slug: parsed.slug },
      include: regionInclude,
    })
    return regionRowToClient(withMask)
  })
}

export async function updateRegionConfig(
  slug: string,
  config: RegionWriteInput,
  auditContext: AuditContext = {},
) {
  const parsed = RegionWriteSchema.parse(config)
  if (parsed.slug !== slug) {
    throw new Error('Slug stimmt nicht mit der Ziel-Region überein')
  }
  return runWithAuditContextAsync(auditContext, async () => {
    const existing = await db.region.findUnique({
      where: { slug },
      include: { categoryAssignments: true },
    })
    if (!existing) throw new RegionNotFoundError(slug)

    const previousHeaderLogoId = existing.headerLogoId
    const previousMask = {
      maskOsmRelationIds: existing.maskOsmRelationIds,
      maskBufferKm: existing.maskBufferKm,
    }

    await validateRegionConfigRelations(parsed, existing.id)

    const oldCategories = [...existing.categoryAssignments]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((assignment) => assignment.categoryId) as MapDataCategoryId[]
    const newCategories = parsed.categories as MapDataCategoryId[]
    const categoriesChanged =
      oldCategories.length !== newCategories.length ||
      oldCategories.some((categoryId, index) => categoryId !== newCategories[index])
    if (categoriesChanged && oldCategories.length > 0) {
      await upsertRegionConfigTemplate(oldCategories)
    }

    // Join lists are full-replaced via nested Prisma deleteMany + create (ordered catalog rows; no
    // stable child IDs). Scalar FKs (contractId, headerLogoId) stay on the parent — contract admin
    // reassigns the inverse with regions.set. Mask columns are synced after write via
    // syncRegionMaskAfterWrite (geometry upload + column update).
    await db.$transaction(async (tx) => {
      await tx.region.update({
        where: { slug },
        data: regionWriteInputToUpdateData(parsed),
      })
      await upsertRegionConfigTemplate(parsed.categories as MapDataCategoryId[], tx)
    })

    if (previousHeaderLogoId != null && previousHeaderLogoId !== parsed.headerLogoId) {
      await deleteRegionUploadIfUnreferenced(previousHeaderLogoId)
    }

    await syncMaskIfChanged(slug, previousMask, parsed)

    const region = await db.region.findUniqueOrThrow({
      where: { slug },
      include: regionInclude,
    })
    return regionRowToClient(region)
  })
}

export async function deleteRegionConfig(slug: string, auditContext: AuditContext = {}) {
  return runWithAuditContextAsync(auditContext, async () => {
    await assertRegionCanBeDeleted(slug)
    const region = await db.region.findUnique({
      where: { slug },
      select: { regionUploads: { select: { s3Key: true } } },
    })
    if (!region) throw new RegionNotFoundError(slug)

    // Delete the DB row first (cascades RegionUpload rows, disconnects the mask upload). Only after
    // it succeeds do we remove the S3 objects + mask — so a failed/raced region delete never leaves
    // a surviving region whose logo/mask files were already destroyed. (deleteRegionMaskUpload keys
    // off the slug, so it still works once the region row is gone.)
    await db.region.delete({ where: { slug } })
    await deleteRegionMaskUpload(slug)
    await Promise.all(
      region.regionUploads.map((upload) => deleteRegionUploadS3Object(upload.s3Key)),
    )
  })
}
