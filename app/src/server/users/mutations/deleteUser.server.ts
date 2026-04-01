import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

const Schema = z.object({
  userId: z.string(),
})

export async function deleteUser(input: { userId: string }, headers: Headers) {
  await requireAdmin(headers)
  const { userId } = Schema.parse(input)
  await db.user.delete({
    where: { id: userId },
  })

  return { success: true, message: 'Benutzer erfolgreich gelöscht' }
}
