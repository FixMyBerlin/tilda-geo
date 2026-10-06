import { queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'
import {
  GC_TIME_QA_MAP_MS,
  STALE_TIME_LONG_CACHE_MS,
  STALE_TIME_NOTES_MS,
} from '@/config/queryStaleTimes'
import { getRegionMemberOsmNamesFn } from '@/server/memberships/memberships.functions'
import {
  getNoteFoldersForRegionFn,
  getNotesAndCommentsForRegionFn,
} from '@/server/notes/notes.functions'
import {
  getQaConfigsForRegionFn,
  getQaDataForMapFn,
} from '@/server/qa-configs/qa-configs.functions'
import {
  getReviewEntriesForListFn,
  getReviewListsForRegionFn,
} from '@/server/review-lists/review-lists.functions'
import type { zodInternalNotesFilterParam } from '@/shared/regionen/regionSearchZod'

type InternalNotesFilter = z.infer<typeof zodInternalNotesFilterParam>

export const regionMemberOsmNamesQueryOptions = (regionSlug: string) => {
  return queryOptions({
    queryKey: ['region', regionSlug, 'memberOsmNames'] as const,
    queryFn: () => getRegionMemberOsmNamesFn({ data: { regionSlug } }),
    staleTime: STALE_TIME_LONG_CACHE_MS,
  })
}

export const internalNotesQueryKey = ['notes', 'getNotesAndCommentsForRegion'] as const

export const internalNotesQueryOptions = (
  regionSlug: string,
  folderId: number | undefined,
  filter: InternalNotesFilter | null | undefined,
) => {
  return queryOptions({
    queryKey: [...internalNotesQueryKey, { regionSlug, folderId, filter }] as const,
    queryFn: () => {
      return getNotesAndCommentsForRegionFn({
        data: { regionSlug, folderId: folderId!, filter: filter ?? undefined },
      })
    },
    staleTime: STALE_TIME_NOTES_MS,
    enabled: folderId !== undefined,
  })
}

export const noteFoldersQueryKey = ['notes', 'getNoteFoldersForRegion'] as const

export const noteFoldersQueryOptions = (regionSlug: string) => {
  return queryOptions({
    queryKey: [...noteFoldersQueryKey, { regionSlug }] as const,
    queryFn: () => getNoteFoldersForRegionFn({ data: { regionSlug } }),
    staleTime: STALE_TIME_NOTES_MS,
  })
}

export const reviewListsQueryOptions = (regionSlug: string) => {
  return queryOptions({
    queryKey: ['review-lists', 'getReviewListsForRegion', { regionSlug }] as const,
    queryFn: () => getReviewListsForRegionFn({ data: { regionSlug } }),
    staleTime: STALE_TIME_NOTES_MS,
  })
}

export const reviewEntriesQueryOptions = (regionSlug: string, listId: number | undefined) => {
  return queryOptions({
    queryKey: ['review-lists', 'getReviewEntriesForList', { regionSlug, listId }] as const,
    queryFn: () => getReviewEntriesForListFn({ data: { regionSlug, listId: listId ?? 0 } }),
    staleTime: STALE_TIME_NOTES_MS,
    enabled: listId !== undefined,
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
  configSlug: string
  regionSlug: string
  userIds?: string[]
  search?: string
}) => {
  return queryOptions({
    queryKey: [
      'qa-configs',
      'getQaDataForMap',
      {
        configSlug: opts.configSlug,
        regionSlug: opts.regionSlug,
        userIds: opts.userIds ?? [],
        search: opts.search ?? '',
      },
    ] as const,
    queryFn: () => {
      return getQaDataForMapFn({
        data: {
          configSlug: opts.configSlug,
          regionSlug: opts.regionSlug,
          userIds: opts.userIds?.length ? opts.userIds : undefined,
          search: opts.search || undefined,
        },
      })
    },
    staleTime: STALE_TIME_LONG_CACHE_MS,
    gcTime: GC_TIME_QA_MAP_MS,
  })
}
