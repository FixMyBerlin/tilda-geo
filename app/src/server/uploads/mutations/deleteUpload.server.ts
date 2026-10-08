import { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import { deleteMapDatasetUpload } from '../mapDatasetUploadService.server'

const DeleteUpload = z.object({
  uploadSlug: z.string(),
})

export async function deleteUpload(input: z.infer<typeof DeleteUpload>, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { uploadSlug } = DeleteUpload.parse(input)
  return deleteMapDatasetUpload(uploadSlug, adminFormAuditContext(headers, admin.userId))
}
