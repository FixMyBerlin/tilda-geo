import { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const DeleteUploadRegion = z.object({
  uploadSlug: z.string(),
  regionSlug: z.string(),
})

export async function deleteUploadRegion(
  input: z.infer<typeof DeleteUploadRegion>,
  headers: Headers,
) {
  const admin = await requireAdmin(headers)
  const { uploadSlug, regionSlug } = DeleteUploadRegion.parse(input)
  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.mapDatasetUpload.update({
      where: { slug: uploadSlug },
      data: {
        regions: {
          disconnect: { slug: regionSlug },
        },
      },
    }),
  )
}
