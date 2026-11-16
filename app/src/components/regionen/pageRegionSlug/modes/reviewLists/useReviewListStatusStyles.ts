import { useQuery } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { DEFAULT_REVIEW_LIST_STATUS_STYLES } from '@/shared/reviewLists/reviewListStatusStyles'
import { useCurrentMode } from '../useCurrentMode'
import { useReviewListsModeValue } from './useReviewListsModeParam'

/** Status labels and colors of the selected review list (first list when none is in the URL). */
export const useReviewListStatusStyles = () => {
  const regionSlug = useRegionSlug()
  const { isReviewLists } = useCurrentMode()
  const { key } = useReviewListsModeValue()
  const { data } = useQuery({ ...reviewListsQueryOptions(regionSlug), enabled: isReviewLists })
  const list = data?.lists.find((item) => item.id === key) ?? data?.lists[0]
  return list?.statusStyles ?? DEFAULT_REVIEW_LIST_STATUS_STYLES
}
