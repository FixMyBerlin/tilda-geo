import type { Prisma, Region } from '@prisma/client'
import { notFound } from '@tanstack/react-router'
import type { StaticRegion } from '@/data/regions.const'
import { staticRegion } from '@/data/regions.const'
import db from '@/server/db.server'
import type { TRegion } from './getRegion.server'

export type RegionWithAdditionalData = Region & StaticRegion

export type GetRegionsInput = Pick<Prisma.RegionFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

export async function getRegionsWithAdditionalData(input: GetRegionsInput = {}) {
  const { where, orderBy = { slug: 'asc' } } = input
  const regions = await db.region.findMany({ where, orderBy })

  const regionsWithAdditionalData = regions.map((region) => {
    const additionalData = staticRegion.find((addData) => addData.slug === region.slug)

    if (!additionalData) {
      throw notFound()
    }

    return {
      ...region,
      ...additionalData,
    }
  })

  return regionsWithAdditionalData satisfies TRegion[]
}
