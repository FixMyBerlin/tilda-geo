import { geoDataClient } from '@/src/server/prisma-client'
import { z } from 'zod'

const MapillaryCoverageMetadataSchema = z.object({
  ml_data_from: z.coerce.date(),
  osm_data_from: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type MapillaryCoverageMetadata = z.infer<typeof MapillaryCoverageMetadataSchema>

export async function getMapillaryCoverageMetadata() {
  const [result] = await geoDataClient.$queryRaw<
    Array<{ ml_data_from: Date; osm_data_from: Date; updated_at: Date }>
  >`
    SELECT ml_data_from, osm_data_from, updated_at
    FROM data.mapillary_coverage_metadata
    ORDER BY id DESC
    LIMIT 1
  `

  if (!result) {
    return null
  }

  return MapillaryCoverageMetadataSchema.parse(result)
}
