import { queryOptions } from '@tanstack/react-query'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import type {
  RegionDatasetSystemLayer,
  RegionDatasetUser,
} from '@/server/uploads/queries/getUploadsForRegion.server'
import {
  getUploadsForRegionSystemLayerFn,
  getUploadsForRegionUserFn,
} from '@/server/uploads/uploads.functions'

export const regionUploadsUserQueryOptions = (regionSlug: string) => {
  return queryOptions<RegionDatasetUser[]>({
    queryKey: ['region', regionSlug, 'uploads', false] as const,
    queryFn: async () => {
      const result = await getUploadsForRegionUserFn({ data: { regionSlug } })
      return result as RegionDatasetUser[]
    },
    staleTime: STALE_TIME_LONG_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: [],
  })
}

export const regionUploadsSystemLayerQueryOptions = (regionSlug: string) => {
  return queryOptions<RegionDatasetSystemLayer[]>({
    queryKey: ['region', regionSlug, 'uploads', true] as const,
    queryFn: () => getUploadsForRegionSystemLayerFn({ data: { regionSlug } }),
    staleTime: STALE_TIME_LONG_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: [],
  })
}
