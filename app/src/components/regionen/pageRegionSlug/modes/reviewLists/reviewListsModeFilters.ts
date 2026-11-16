import {
  REVIEW_STATUSES,
  type ReviewListStatusStyles,
} from '@/shared/reviewLists/reviewListStatusStyles'

export const reviewStatusFilterOptions = (styles: ReviewListStatusStyles) => [
  { value: 'all' as const, label: 'Alle' },
  ...REVIEW_STATUSES.map((status) => ({ value: status, label: styles[status].label })),
]
