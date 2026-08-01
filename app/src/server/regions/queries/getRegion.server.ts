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

async function findRegionRow(input: { slug: string }) {
  const { slug } = GetRegionSchema.parse(input)

  const region = await db.region.findFirst({
    where: { slug },
    include: regionInclude,
  })

  if (!region) {
    throw notFound()
  }

  return region
}

export async function getRegion(input: { slug: string }) {
  return regionRowToClient(await findRegionRow(input))
}

/** Client `TRegion` + write-shaped `config` for MCP / admin API round-trips into create/update. */
export async function getRegionWithWriteConfig(input: { slug: string }) {
  const region = await findRegionRow(input)

  return {
    region: regionRowToClient(region),
    config: regionRowToWriteInput(region),
  } satisfies { region: TRegion; config: RegionWriteInput }
}

export async function getRegionEditData(input: { slug: string }) {
  const { region, config } = await getRegionWithWriteConfig(input)

  return {
    region,
    config,
    // Precompute on the server so mask IDs are plain strings in loader data (avoids Int[] /
    // shared-ref quirks on the client when seeding TanStack Form defaultValues).
    formValues: regionConfigToFormValues(config) as RegionFormInput,
  } satisfies { region: TRegion; config: RegionWriteInput; formValues: RegionFormInput }
}
