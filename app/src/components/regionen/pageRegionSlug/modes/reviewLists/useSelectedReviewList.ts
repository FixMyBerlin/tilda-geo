import { useSuspenseQuery } from '@tanstack/react-query'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { useReviewListsModeParam } from './useReviewListsModeParam'

/** The region's review lists and the one the URL selects; without `key` the first list. */
export const useSelectedReviewList = () => {
  const region = useRegion()
  const { reviewListsMode } = useReviewListsModeParam()
  // Primed by the route loader (ensureQueryData), so this suspends only on hard refresh races
  // and cooperates with the route pendingComponent.
  const { data: listsData } = useSuspenseQuery(reviewListsQueryOptions(region.slug))
  const lists = listsData.lists
  const selectedListId = reviewListsMode.key ?? lists[0]?.id
  const selectedList = lists.find((list) => list.id === selectedListId)

  return { lists, selectedListId, selectedList }
}
