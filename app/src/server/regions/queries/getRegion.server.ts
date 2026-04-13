import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { staticRegion } from '@/data/regions.const'
import db from '@/server/db.server'

const GetRegionSchema = z.object({
  slug: z.string(),
})

export type TRegion = Awaited<ReturnType<typeof getRegion>>

export async function getRegion(input: { slug: string }) {
  const { slug } = GetRegionSchema.parse(input)

  const region = await db.region.findFirst({
    where: { slug },
  })

  if (!region) {
    throw notFound()
  }

  const additionalData = staticRegion.find((addData) => addData.slug === region.slug)

  if (!additionalData) {
    throw notFound()
  }

  return { ...region, ...additionalData }
}
