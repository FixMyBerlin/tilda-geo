import { z } from 'zod'

const qaDecisionDataBreakdownSchema = z.record(
  z.string(),
  z.object({ reference: z.number(), current: z.number() }),
)

const qaDecisionDataSchema = z.object({
  reference: z.number(),
  current: z.number(),
  difference: z.number(),
  deviation: z.number(),
  breakdown: qaDecisionDataBreakdownSchema.optional(),
  thresholds: z.object({
    goodThreshold: z.number(),
    needsReviewThreshold: z.number(),
    absoluteDifferenceThreshold: z.number(),
  }),
})

export type QaDecisionData = z.infer<typeof qaDecisionDataSchema>

// Helper function to transform evaluation with parsed decision data
export function transformEvaluationWithDecisionData<T extends { decisionData: unknown }>(
  evaluation: T,
): Omit<T, 'decisionData'> & { decisionData: QaDecisionData | null } {
  const parsedDecisionData = evaluation.decisionData
    ? qaDecisionDataSchema.safeParse(evaluation.decisionData)
    : null

  return {
    ...evaluation,
    decisionData: parsedDecisionData?.success ? parsedDecisionData.data : null,
  }
}
