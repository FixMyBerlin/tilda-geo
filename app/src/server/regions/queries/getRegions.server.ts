import { notFound } from '@tanstack/react-router'
import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  regionInclude,
  regionRowToClient,
  type TRegion,
} from '@/server/regions/regionConfigMapper.server'

export type GetRegionsInput = {
  where?: Prisma.RegionWhereInput
  orderBy?: Prisma.RegionOrderByWithRelationInput
}

type GetRegionRowsInput = Pick<Prisma.RegionFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

/** Client regions (`TRegion`) with contract joined via `regionInclude`. */
export async function getRegions(input: GetRegionsInput = {}) {
  const { where, orderBy = { slug: 'asc' } } = input
  const regions = await db.region.findMany({ where, orderBy, include: regionInclude })

  if (regions.length === 0 && where?.slug) {
    throw notFound()
  }

  return regions.map(regionRowToClient) satisfies TRegion[]
}

/** Admin-only raw `Region` rows (e.g. id/slug pickers); no `regionInclude`. */
export async function getRegionRows(input: GetRegionRowsInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, orderBy = { slug: 'asc' }, skip, take } = input
  return await db.region.findMany({ where, orderBy, skip, take })
}
