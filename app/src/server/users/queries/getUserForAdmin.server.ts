import { notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

/** One user for `/admin/users/$userId/edit`; related data lives on the linked, filtered lists. */
export async function getUserForAdmin(input: { userId: string }, headers: Headers) {
  await requireAdmin(headers)

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      osmId: true,
      osmName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { memberships: true } },
    },
  })
  if (!user) throw notFound()

  return user
}
