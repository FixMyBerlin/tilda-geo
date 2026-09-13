import { useSearch } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactReviewListsModeParam,
  zodReviewListsModeParam,
  type ReviewListsModeParam,
} from './reviewListsModeParam'

/** Read the review lists mode param (`review` JSON). Route-agnostic so map layers can read it too. */
export const useReviewListsModeValue = () => {
  const value = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.reviewLists],
  })
  return zodReviewListsModeParam.safeParse(value).data ?? {}
}

/** Read/update the review lists mode param. Updates preserve other params and replace history. */
export const useReviewListsModeParam = () => {
  const reviewListsMode = useReviewListsModeValue()
  const { updateSearch } = useRegionSearchNavigation()

  const setReviewListsModeParam = (next: ReviewListsModeParam) => {
    updateSearch(
      { [searchParamsRegistry.reviewLists]: compactReviewListsModeParam(next) },
      { replace: true },
    )
  }

  return { reviewListsMode, setReviewListsModeParam }
}
