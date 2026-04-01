import { queryOptions } from '@tanstack/react-query'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import { getProcessingMetadataFn } from '@/server/regions/regions.functions'

export const processingMetadataQueryKey = ['processingMetadata'] as const

export const processingMetadataQueryOptions = () => {
  return queryOptions({
    queryKey: processingMetadataQueryKey,
    queryFn: () => getProcessingMetadataFn(),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}
