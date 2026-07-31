import type { AuditContext } from '@/server/audit/auditContext.server'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'

/** Persist a RegionUpload library row after the file landed in S3 (does NOT set headerLogoId). */
export async function createRegionUpload(
  input: {
    regionId: number
    s3Key: string
    title: string
    mimeType: string
    fileSize: number
    createdById?: string | null
  },
  auditContext: AuditContext = { metadata: { changeSource: 'ADMIN_FORM' } },
) {
  return runWithAuditContextAsync({ userId: input.createdById ?? undefined, ...auditContext }, () =>
    db.regionUpload.create({
      data: {
        regionId: input.regionId,
        s3Key: input.s3Key,
        title: input.title,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        createdById: input.createdById ?? null,
      },
    }),
  )
}
