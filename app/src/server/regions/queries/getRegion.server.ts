import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import db from '@/server/db.server'
import {
  regionInclude,
  regionRowToClient,
  regionRowToWriteInput,
  type TRegion,
} from '@/server/regions/regionConfigMapper.server'
import {
  regionConfigToFormValues,
  type RegionFormInput,
  type RegionWriteInput,
} from '@/server/regions/regionWriteSchema'

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

  const config = regionRowToWriteInput(region)
  return {
    region: regionRowToClient(region),
    config,
    // Precompute on the server so mask IDs are plain strings in loader data (avoids Int[] /
    // shared-ref quirks on the client when seeding TanStack Form defaultValues).
    formValues: regionConfigToFormValues(config) as RegionFormInput,
  } satisfies { region: TRegion; config: RegionWriteInput; formValues: RegionFormInput }
}
