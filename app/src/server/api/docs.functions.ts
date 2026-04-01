import { createServerFn } from '@tanstack/react-start'
import { getMapillaryCoverageMetadata } from '@/server/api/util/getMapillaryCoverageMetadata.server'

export const getMapillaryCoverageMetadataLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => getMapillaryCoverageMetadata(),
)
