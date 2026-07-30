import { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const DeleteUpload = z.object({
  uploadSlug: z.string(),
})

export async function deleteUpload(input: z.infer<typeof DeleteUpload>, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { uploadSlug } = DeleteUpload.parse(input)
  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.mapDatasetUpload.delete({
      where: { slug: uploadSlug },
    }),
  )
}
