import { queryOptions } from '@tanstack/react-query'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import { getCurrentUserLoaderFn } from '@/server/users/users.functions'

export const currentUserQueryKey = ['users', 'currentUser'] as const

export const currentUserQueryOptions = () => {
  return queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: () => getCurrentUserLoaderFn(),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}
