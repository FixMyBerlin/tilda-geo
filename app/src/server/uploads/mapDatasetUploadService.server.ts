import { runWithAuditContextAsync, type AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { optionalTrimmed } from '@/server/utils/searchString'

/**
 * Map dataset upload reads and writes without an auth check — callers (admin UI mutations, admin
 * MCP tools) authorize first and pass their audit context.
 */

type ListMapDatasetUploadsInput = { regionSlug?: string; categoryKey?: string }

/** Compact rows: no layers, no full configs. */
export async function listMapDatasetUploads(input: ListMapDatasetUploadsInput = {}) {
  const regionSlug = optionalTrimmed(input.regionSlug)
  const categoryKey = optionalTrimmed(input.categoryKey)

  const uploads = await db.mapDatasetUpload.findMany({
    where: {
      ...(regionSlug ? { regions: { some: { slug: regionSlug } } } : {}),
      ...(categoryKey ? { layerConfigs: { some: { categoryKey } } } : {}),
    },
    orderBy: [{ slug: 'asc' }, { id: 'asc' }],
    select: {
      slug: true,
      public: true,
      createdBy: true,
      updatedAt: true,
      dataUpdatedNote: true,
      regions: { select: { slug: true }, orderBy: { slug: 'asc' } },
      layerConfigs: {
        select: { name: true, categoryKey: true },
        orderBy: [{ subId: 'asc' }, { id: 'asc' }],
      },
    },
  })

  return uploads.map(({ regions, layerConfigs, ...upload }) => ({
    ...upload,
    regionSlugs: regions.map((region) => region.slug),
    configs: layerConfigs,
  }))
}

/** The full row (including the `configs` JSON) plus its region slugs; `null` when the slug is unknown. */
export async function getMapDatasetUpload(slug: string) {
  const upload = await db.mapDatasetUpload.findUnique({
    where: { slug },
    include: { regions: { select: { slug: true }, orderBy: { slug: 'asc' } } },
  })
  if (!upload) return null

  const { regions, ...row } = upload
  return { ...row, regionSlugs: regions.map((region) => region.slug) }
}

async function getMapDatasetUploadOrThrow(slug: string) {
  const upload = await getMapDatasetUpload(slug)
  if (!upload) throw new Error(`Map dataset upload not found: ${slug}`)
  return upload
}

/**
 * Deletes the database row (its layer-config rows cascade, region links are dropped). The files on
 * S3 are not touched. Returns the row as it was before the delete.
 */
export async function deleteMapDatasetUpload(slug: string, auditContext: AuditContext = {}) {
  const upload = await getMapDatasetUploadOrThrow(slug)
  await runWithAuditContextAsync(auditContext, () =>
    db.mapDatasetUpload.delete({ where: { slug } }),
  )
  return upload
}

/** Unlinks one region; the upload and its other region links stay. */
export async function removeMapDatasetUploadRegion(
  { uploadSlug, regionSlug }: { uploadSlug: string; regionSlug: string },
  auditContext: AuditContext = {},
) {
  const upload = await getMapDatasetUploadOrThrow(uploadSlug)
  if (!upload.regionSlugs.includes(regionSlug)) {
    throw new Error(`Map dataset upload ${uploadSlug} is not linked to region ${regionSlug}`)
  }

  const regionSlugs = upload.regionSlugs.filter((slug) => slug !== regionSlug)

  await db.mapDatasetUpload.update({
    where: { slug: uploadSlug },
    data: { regions: { disconnect: { slug: regionSlug } } },
  })
  // The audit extension only diffs scalar columns, so a relation-only update leaves no row.
  await db.auditLog.create({
    data: {
      ...auditContext,
      action: 'UPDATE',
      model: 'MapDatasetUpload',
      recordId: String(upload.id),
      oldData: { regionSlugs: upload.regionSlugs },
      newData: { regionSlugs },
      changedFields: ['regions'],
    },
  })

  return { slug: uploadSlug, regionSlugs }
}
