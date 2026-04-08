import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getMapillaryCoverageMetadata } from '@/server/api/util/getMapillaryCoverageMetadata.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'

export const getMapillaryCoverageMetadataLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => getMapillaryCoverageMetadata(),
)

const getRegionForDocsInputSchema = z.object({
  slug: z.string(),
})

export const getRegionForDocsLoaderFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.input<typeof getRegionForDocsInputSchema>) =>
    getRegionForDocsInputSchema.parse(data),
  )
  .handler(async ({ data }) => getRegion({ slug: data.slug }))
