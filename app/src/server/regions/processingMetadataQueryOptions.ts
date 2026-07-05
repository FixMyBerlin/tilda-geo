import { queryOptions } from '@tanstack/react-query'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import { getProcessingMetaFn } from '@/server/regions/regions.functions'

const processingMetadataQueryKey = ['processingMetadata'] as const

export const processingMetadataQueryOptions = () => {
  return queryOptions({
    queryKey: processingMetadataQueryKey,
    queryFn: () => getProcessingMetaFn(),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}
