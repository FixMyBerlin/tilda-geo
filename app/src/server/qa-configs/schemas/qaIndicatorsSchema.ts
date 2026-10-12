import { z } from 'zod'

// Client-importable: no server-only imports (topic-doc validation of the keys lives in
// validateQaIndicatorTagKeys.ts) so the admin form can reuse this schema in the browser.

/**
 * Key of the indicator that compares the plain amount per cell (parking spaces, bikelane meters).
 * Every other indicator is keyed by the tag it splits that amount by, e.g. `condition_category_primary`.
 */
export const QA_TOTAL_INDICATOR_KEY = 'total'

/** The tag an indicator splits the amount by; `null` for the total. */
export const qaIndicatorTagKey = (key: string) => (key === QA_TOTAL_INDICATOR_KEY ? null : key)

const thresholdFields = {
  goodThreshold: z.number().min(0),
  needsReviewThreshold: z.number().min(0),
  absoluteDifferenceThreshold: z.number().min(0),
}

const hasThresholdOrder = (thresholds: { goodThreshold: number; needsReviewThreshold: number }) =>
  thresholds.needsReviewThreshold >= thresholds.goodThreshold

const thresholdOrderIssue = {
  message: '„Überprüfung bis“ muss mindestens so groß sein wie „Gut bis“',
  path: ['needsReviewThreshold'],
}

export const qaIndicatorThresholdsSchema = z
  .object(thresholdFields)
  .refine(hasThresholdOrder, thresholdOrderIssue)

const qaIndicatorSchema = z
  .object({ key: z.string().min(1), label: z.string().min(1), ...thresholdFields })
  .refine(hasThresholdOrder, thresholdOrderIssue)

export type QaIndicator = z.infer<typeof qaIndicatorSchema>

export const qaIndicatorsSchema = z
  .array(qaIndicatorSchema)
  .min(1, 'Mindestens ein Indikator ist erforderlich')
  .refine((indicators) => new Set(indicators.map(({ key }) => key)).size === indicators.length, {
    message: 'Jedes Merkmal darf nur einmal vorkommen',
  })
