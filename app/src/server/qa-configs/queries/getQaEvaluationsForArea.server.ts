import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import db from '@/server/db.server'
import { transformEvaluationWithDecisionData } from '@/server/qa-configs/schemas/qaDecisionDataSchema'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})

export async function getQaEvaluationsForArea(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)

  const { configSlug, areaId, regionSlug } = Schema.parse(input)

  const { isAuthorized } = await checkRegionAuthorization(appSession, regionSlug)

  if (!isAuthorized) {
    return []
  }

  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })

  if (!qaConfig) {
    return []
  }

  const evaluations = await db.qaEvaluation.findMany({
    where: { configId: qaConfig.id, areaId },
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
    orderBy: { createdAt: 'desc' },
  })

  const data = evaluations.map((evaluation) => transformEvaluationWithDecisionData(evaluation))
  return data
}

export type QaEvaluationForArea = Awaited<ReturnType<typeof getQaEvaluationsForArea>>[number]
