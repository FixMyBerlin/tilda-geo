import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const DeleteUpload = z.object({
  uploadSlug: z.string(),
})

export async function deleteUpload(input: z.infer<typeof DeleteUpload>, headers: Headers) {
  await requireAdmin(headers)
  const { uploadSlug } = DeleteUpload.parse(input)
  return await db.upload.delete({
    where: { slug: uploadSlug },
  })
}
