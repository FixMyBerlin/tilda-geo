import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import db from '@/server/db.server'
import {
  regionInclude,
  regionRowToClient,
  regionRowToMaskConfig,
  regionRowToWriteInput,
  type RegionMaskConfig,
  type TRegion,
} from '@/server/regions/regionConfigMapper.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'

const GetRegionSchema = z.object({
  slug: z.string(),
})

export async function getRegion(input: { slug: string }) {
  const { slug } = GetRegionSchema.parse(input)

  const region = await db.region.findFirst({
    where: { slug },
    include: regionInclude,
  })

  if (!region) {
    throw notFound()
  }

  return regionRowToClient(region)
}

export async function getRegionEditData(input: { slug: string }) {
  const { slug } = GetRegionSchema.parse(input)

  const region = await db.region.findFirst({
    where: { slug },
    include: regionInclude,
  })

  if (!region) {
    throw notFound()
  }

  return {
    region: regionRowToClient(region),
    config: regionRowToWriteInput(region),
    maskConfig: regionRowToMaskConfig(region),
  } satisfies { region: TRegion; config: RegionWriteInput; maskConfig: RegionMaskConfig }
}
