import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

type GetRegionsInput = Pick<Prisma.RegionFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

export async function getRegions(input: GetRegionsInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, orderBy = { slug: 'asc' }, skip, take } = input
  return await db.region.findMany({ where, orderBy, skip, take })
}
