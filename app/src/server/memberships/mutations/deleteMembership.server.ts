import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const DeleteMembership = z.object({
  id: z.number(),
})

export async function deleteMembership(input: z.infer<typeof DeleteMembership>, headers: Headers) {
  await requireAdmin(headers)
  const { id } = DeleteMembership.parse(input)
  return await db.membership.deleteMany({ where: { id } })
}
