import { z } from 'zod'
import { QaEvaluationStatus } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import {
  qaDecisionDataSchema,
  transformEvaluationWithDecisionData,
} from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import type { QaDecisionData } from '../queries/getQaDecisionDataForArea.server'

export const CreateQaEvaluationSchema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
  userStatus: z.enum(QaEvaluationStatus),
  body: z.string().optional(),
  decisionData: qaDecisionDataSchema
    .omit({
      goodThreshold: true,
      needsReviewThreshold: true,
    })
    .optional(),
})

export async function createQaEvaluation(
  input: z.infer<typeof CreateQaEvaluationSchema>,
  headers: Headers,
) {
  const appSession = await requireAuth(headers)
  await authorizeRegionMemberByRegionSlug(appSession, input.regionSlug)

  const { configSlug, areaId, userStatus, body, decisionData } =
    CreateQaEvaluationSchema.parse(input)
  const qaConfig = await db.qaConfig.findFirstOrThrow({
    where: { slug: configSlug },
  })

  let storedDecisionData: undefined | QaDecisionData

  if (decisionData) {
    storedDecisionData = qaDecisionDataSchema.parse({
      ...decisionData,
      goodThreshold: qaConfig.goodThreshold,
      needsReviewThreshold: qaConfig.needsReviewThreshold,
    })
  }

  const evaluation = await db.qaEvaluation.create({
    data: {
      configId: qaConfig.id,
      areaId,
      userStatus,
      body: body || null,
      evaluatorType: 'USER',
      userId: appSession.userId,
      systemStatus: 'NEEDS_REVIEW', // Default, will be updated by system
      decisionData: storedDecisionData,
    },
    include: {
      author: {
        select: {
          id: true,
          osmName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return transformEvaluationWithDecisionData(evaluation)
}
