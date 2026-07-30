import { queryOptions } from '@tanstack/react-query'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import { getRegionenIndexLoaderFn } from '@/server/regions/regionen.functions'

export const regionenIndexQueryKey = ['regionen', 'index'] as const

export const regionenIndexQueryOptions = () => {
  return queryOptions({
    queryKey: regionenIndexQueryKey,
    queryFn: () => getRegionenIndexLoaderFn(),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}
