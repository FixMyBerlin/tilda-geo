import { notFound } from '@tanstack/react-router'
import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  regionInclude,
  regionRowToClient,
  regionRowToWriteInput,
  type TRegion,
} from '@/server/regions/regionConfigMapper.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'

export type GetRegionsInput = {
  where?: Prisma.RegionWhereInput
  orderBy?: Prisma.RegionOrderByWithRelationInput
}

type GetRegionRowsInput = Pick<Prisma.RegionFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

async function findRegionRows(input: GetRegionsInput) {
  const { where, orderBy = { slug: 'asc' } } = input
  const regions = await db.region.findMany({ where, orderBy, include: regionInclude })

  if (regions.length === 0 && where?.slug) {
    throw notFound()
  }

  return regions
}

/** Client regions (`TRegion`) with contract joined via `regionInclude`. */
export async function getRegions(input: GetRegionsInput = {}) {
  const regions = await findRegionRows(input)

  return regions.map(regionRowToClient) satisfies TRegion[]
}

/** Client + write-shaped config per region for MCP round-trips into create/update. */
export async function getRegionsWithWriteConfig(input: GetRegionsInput = {}) {
  const regions = await findRegionRows(input)

  return regions.map((region) => ({
    region: regionRowToClient(region),
    config: regionRowToWriteInput(region),
  })) satisfies Array<{ region: TRegion; config: RegionWriteInput }>
}

/** Admin-only raw `Region` rows (e.g. id/slug pickers); no `regionInclude`. */
export async function getRegionRows(input: GetRegionRowsInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, orderBy = { slug: 'asc' }, skip, take } = input
  return await db.region.findMany({ where, orderBy, skip, take })
}
