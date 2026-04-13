import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { GetUploadSchema } from '../schema'

export async function getUploadWithRegions(input: { slug: string }, headers: Headers) {
  await requireAdmin(headers)
  const { slug } = GetUploadSchema.parse(input)

  return await db.upload.findFirstOrThrow({
    where: { slug },
    include: { regions: { select: { id: true, slug: true } } },
  })
}
