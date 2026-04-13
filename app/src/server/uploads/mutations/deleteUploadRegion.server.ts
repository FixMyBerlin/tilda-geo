import { z } from 'zod'
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
  await requireAdmin(headers)
  const { uploadSlug, regionSlug } = DeleteUploadRegion.parse(input)
  return await db.upload.update({
    where: { slug: uploadSlug },
    data: {
      regions: {
        disconnect: { slug: regionSlug },
      },
    },
  })
}
