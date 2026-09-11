import { z } from 'zod'
import { QaEvaluationStatus } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import {
  calculateSystemStatus,
  getEffectiveSystemStatus,
} from '@/server/qa-configs/evaluation/qaEvaluationRules'
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

  const { configSlug, areaId, regionSlug, userStatus, body, decisionData } =
    CreateQaEvaluationSchema.parse(input)
  const qaConfig = await db.qaConfig.findFirstOrThrow({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })

  let storedDecisionData: undefined | QaDecisionData

  if (decisionData) {
    storedDecisionData = qaDecisionDataSchema.parse({
      ...decisionData,
      goodThreshold: qaConfig.goodThreshold,
      needsReviewThreshold: qaConfig.needsReviewThreshold,
    })
  }

  // Nightly compares against this row. Prefer the counts the user is saving so a
  // previous user row with the old NEEDS_REVIEW placeholder is not copied forward.
  const systemStatus = storedDecisionData
    ? getEffectiveSystemStatus({
        systemStatus: calculateSystemStatus(storedDecisionData.relative, qaConfig),
        absoluteDifference: storedDecisionData.absoluteChange,
        absoluteDifferenceThreshold: qaConfig.absoluteDifferenceThreshold,
      }).effectiveSystemStatus
    : ((
        await db.qaEvaluation.findFirst({
          where: { configId: qaConfig.id, areaId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { systemStatus: true },
        })
      )?.systemStatus ?? 'NEEDS_REVIEW')

  const evaluation = await runWithAuditContextAsync(
    memberFormAuditContext(headers, appSession.userId),
    () =>
      db.qaEvaluation.create({
        data: {
          configId: qaConfig.id,
          areaId,
          userStatus,
          body: body || null,
          evaluatorType: 'USER',
          userId: appSession.userId,
          systemStatus,
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
      }),
  )

  return transformEvaluationWithDecisionData(evaluation)
}
