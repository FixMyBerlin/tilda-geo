import { useNavigate, useSearch } from '@tanstack/react-router'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactReviewListsModeParam,
  zodReviewListsModeParam,
  type ReviewListsModeParam,
} from './reviewListsModeParam'

/** Read the review lists mode param (`rl` JSON). Route-agnostic so map layers can read it too. */
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
  const navigate = useNavigate()

  const setReviewListsModeParam = (next: ReviewListsModeParam) => {
    void navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        [searchParamsRegistry.reviewLists]: compactReviewListsModeParam(next),
      }),
      replace: true,
    })
  }

  return { reviewListsMode, setReviewListsModeParam }
}
