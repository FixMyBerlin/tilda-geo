import { z } from 'zod'

export const REVIEW_STATUSES = ['OPEN', 'OK', 'PROBLEM'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als Hex-Wert, z.B. #16a34a')

const ReviewStatusStyleSchema = z.object({
  label: z.string().trim().min(1),
  color: hexColor,
})

/** Button label and map color per status, set per review list in the admin. */
export const ReviewListStatusStylesSchema = z.object({
  OPEN: ReviewStatusStyleSchema,
  OK: ReviewStatusStyleSchema,
  PROBLEM: ReviewStatusStyleSchema,
})

export type ReviewListStatusStyles = z.infer<typeof ReviewListStatusStylesSchema>

export const DEFAULT_REVIEW_LIST_STATUS_STYLES: ReviewListStatusStyles = {
  OPEN: { label: 'Offen', color: '#6b7280' }, // gray-500
  OK: { label: 'OK', color: '#16a34a' }, // green-600
  PROBLEM: { label: 'Problem', color: '#dc2626' }, // red-600
}

/** Text color that stays readable on `hexColor` (dark text on light colors such as yellow). */
export const readableTextColor = (hexColor: string) => {
  const channel = (start: number) => Number.parseInt(hexColor.slice(start, start + 2), 16)
  const luminance = (0.299 * channel(1) + 0.587 * channel(3) + 0.114 * channel(5)) / 255
  return luminance > 0.6 ? '#111827' : '#ffffff' // gray-900 / white
}

/** Stored value (`ReviewList.statusStyles`, nullable JSON) → styles, defaults when unset or invalid. */
export const parseReviewListStatusStyles = (value: unknown) => {
  const parsed = ReviewListStatusStylesSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_REVIEW_LIST_STATUS_STYLES
}
