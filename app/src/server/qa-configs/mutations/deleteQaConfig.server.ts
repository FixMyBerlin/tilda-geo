import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteQaConfigSchema } from '../schemas'

export async function deleteQaConfig(input: { id: number }, headers: Headers) {
  await requireAdmin(headers)
  const { id } = DeleteQaConfigSchema.parse(input)
  return db.qaConfig.delete({ where: { id } })
}
