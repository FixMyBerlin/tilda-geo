import { queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'
import type { zodInternalNotesFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { STALE_TIME_LONG_CACHE_MS, STALE_TIME_NOTES_MS } from '@/config/queryStaleTimes'
import { getNotesAndCommentsForRegionFn } from '@/server/notes/notes.functions'
import {
  getQaConfigsForRegionFn,
  getQaDataForMapFn,
} from '@/server/qa-configs/qa-configs.functions'

type InternalNotesFilter = z.infer<typeof zodInternalNotesFilterParam>

export const internalNotesQueryKey = ['notes', 'getNotesAndCommentsForRegion'] as const

export const internalNotesQueryOptions = (
  regionSlug: string,
  filter: InternalNotesFilter | null | undefined,
) => {
  return queryOptions({
    queryKey: [...internalNotesQueryKey, { regionSlug, filter }] as const,
    queryFn: () => {
      return getNotesAndCommentsForRegionFn({
        data: { regionSlug, filter: filter ?? undefined },
      })
    },
    staleTime: STALE_TIME_NOTES_MS,
  })
}

export const regionQaConfigsQueryOptions = (regionSlug: string) => {
  return queryOptions({
    queryKey: ['region', regionSlug, 'qaConfigs'] as const,
    queryFn: () => getQaConfigsForRegionFn({ data: { regionSlug } }),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}

export const qaDataForMapQueryOptions = (opts: {
  configId: number
  regionSlug: string
  userIds?: string[]
}) => {
  return queryOptions({
    queryKey: [
      'qa-configs',
      'getQaDataForMap',
      {
        configId: opts.configId,
        regionSlug: opts.regionSlug,
        userIds: opts.userIds ?? [],
      },
    ] as const,
    queryFn: () => {
      return getQaDataForMapFn({
        data: {
          configId: opts.configId,
          regionSlug: opts.regionSlug,
          userIds: opts.userIds?.length ? opts.userIds : undefined,
        },
      })
    },
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}
