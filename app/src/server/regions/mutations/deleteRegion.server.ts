import type { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteRegionSchema } from '../schemas'

export async function deleteRegion(input: z.infer<typeof DeleteRegionSchema>, headers: Headers) {
  await requireAdmin(headers)
  const { slug } = DeleteRegionSchema.parse(input)
  const region = await db.region.deleteMany({ where: { slug } })

  return region
}
