import db from '@/server/db.server'
import { deleteRegionUploadS3Object } from '@/server/regions/uploads/regionUploadsS3.server'

/**
 * Delete a RegionUpload (S3 object + DB row) only if no Region FK still points at it (e.g.
 * headerLogoId). Lets the admin "remove" a logo without orphaning a file that's used elsewhere.
 *
 * Inherits the caller's ambient audit context (the only caller, updateRegionConfig, already runs
 * inside runWithAuditContextAsync). Do NOT wrap in a fresh context here: hard-coding changeSource
 * ADMIN_FORM would mislabel Bearer/MCP-initiated header-logo swaps and drop ipAddress/adminTokenId.
 */
export async function deleteRegionUploadIfUnreferenced(id: number) {
  const upload = await db.regionUpload.findUnique({
    where: { id },
    select: { id: true, s3Key: true },
  })
  if (!upload) return

  const referencedAsHeaderLogo = await db.region.count({ where: { headerLogoId: id } })
  if (referencedAsHeaderLogo > 0) return

  await deleteRegionUploadS3Object(upload.s3Key)
  await db.regionUpload.delete({ where: { id } })
}
