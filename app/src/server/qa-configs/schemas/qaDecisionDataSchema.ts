import { z } from 'zod'

export const qaDecisionDataSchema = z.object({
  relative: z.number().nullable(),
  currentCount: z.number().nullable(),
  referenceCount: z.number().nullable(),
  absoluteChange: z.number().nullable(),
  goodThreshold: z.number(),
  needsReviewThreshold: z.number(),
})

export type QaDecisionDataStored = z.infer<typeof qaDecisionDataSchema>

// Helper function to transform evaluation with parsed decision data
export function transformEvaluationWithDecisionData<T extends { decisionData: unknown }>(
  evaluation: T,
): Omit<T, 'decisionData'> & { decisionData: QaDecisionDataStored | null } {
  const parsedDecisionData = evaluation.decisionData
    ? qaDecisionDataSchema.safeParse(evaluation.decisionData)
    : null

  return {
    ...evaluation,
    decisionData: parsedDecisionData?.success ? parsedDecisionData.data : null,
  }
}
