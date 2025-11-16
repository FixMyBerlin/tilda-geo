import db, { QaEvaluationStatus } from '@/db'
import { authorizeRegionAdmin } from '@/src/server/authorization/authorizeRegionAdmin'
import {
  qaDecisionDataSchema,
  transformEvaluationWithDecisionData,
} from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'
import getRegionIdBySlug from '@/src/server/regions/queries/getRegionIdBySlug'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'
import { QaDecisionData } from '../queries/getQaDecisionDataForArea'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
  userStatus: z.nativeEnum(QaEvaluationStatus),
  body: z.string().optional(),
  decisionData: qaDecisionDataSchema
    .omit({
      goodThreshold: true,
      needsReviewThreshold: true,
    })
    .optional(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  authorizeRegionAdmin(getRegionIdBySlug),
  async ({ configSlug, areaId, userStatus, body, decisionData }, { session }: Ctx) => {
    const qaConfig = await db.qaConfig.findFirstOrThrow({
      where: { slug: configSlug },
    })

    let storedDecisionData: undefined | QaDecisionData = undefined

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
        userId: session.userId,
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
  },
)
