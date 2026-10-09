import { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import { removeMapDatasetUploadRegion } from '../mapDatasetUploadService.server'

const DeleteUploadRegion = z.object({
  uploadSlug: z.string(),
  regionSlug: z.string(),
})

export async function deleteUploadRegion(
  input: z.infer<typeof DeleteUploadRegion>,
  headers: Headers,
) {
  const admin = await requireAdmin(headers)
  return removeMapDatasetUploadRegion(
    DeleteUploadRegion.parse(input),
    adminFormAuditContext(headers, admin.userId),
  )
}
