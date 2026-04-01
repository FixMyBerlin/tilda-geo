import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { MembershipSchema } from '../schema'

const UpdateMembership = MembershipSchema.extend({
  id: z.number(),
})

export async function updateMembership(input: z.infer<typeof UpdateMembership>, headers: Headers) {
  await requireAdmin(headers)
  const { id, ...data } = UpdateMembership.parse(input)
  return db.membership.update({ where: { id }, data })
}
