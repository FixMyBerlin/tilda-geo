export const REVIEW_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'OPEN', label: 'Offen' },
  { value: 'OK', label: 'OK' },
  { value: 'PROBLEM', label: 'Problem' },
] as const

export const STATUS_LABEL = {
  OPEN: 'Offen',
  OK: 'OK',
  PROBLEM: 'Problem',
} as const
export type ReviewStatus = keyof typeof STATUS_LABEL
