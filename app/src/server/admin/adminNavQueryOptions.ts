import { queryOptions } from '@tanstack/react-query'
import { getAdminNavCountsFn, getAdminNavRegionsFn } from '@/server/admin/adminNav.functions'

// Mutations invalidate these keys explicitly; the stale time only keeps the SSR-hydrated data from
// refetching right after mount and on every admin navigation (`revalidateIfStale` in the loaders).
const ADMIN_NAV_STALE_TIME_MS = 60 * 1000

export const adminNavCountsQueryOptions = () => {
  return queryOptions({
    queryKey: ['admin', 'navCounts'] as const,
    queryFn: () => getAdminNavCountsFn(),
    staleTime: ADMIN_NAV_STALE_TIME_MS,
  })
}

/** Region search list (`AdminRegionPicker`). Nested under the counts key so existing `navCounts` invalidations (region create/delete) refresh it too. */
export const adminNavRegionsQueryOptions = () => {
  return queryOptions({
    queryKey: ['admin', 'navCounts', 'regions'] as const,
    queryFn: () => getAdminNavRegionsFn(),
    staleTime: ADMIN_NAV_STALE_TIME_MS,
  })
}
