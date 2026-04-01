import type { Prisma } from '@prisma/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

type GetUsersInput = Pick<Prisma.UserFindManyArgs, 'where' | 'orderBy'>

export type User = Awaited<ReturnType<typeof getUsers>>[number]

export async function getUsers(input: GetUsersInput = {}, headers: Headers) {
  await requireAdmin(headers)
  const { where, orderBy = { id: 'asc' } } = input

  const users = await db.user.findMany({
    where,
    orderBy,
    select: {
      id: true,
      osmId: true,
      osmName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  })

  return users
}
