import db, { QaEvaluationStatus } from '@/db'
import { authorizeRegionAdmin } from '@/src/server/authorization/authorizeRegionAdmin'
import getRegionIdBySlug from '@/src/server/regions/queries/getRegionIdBySlug'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
  userStatus: z.nativeEnum(QaEvaluationStatus),
  body: z.string().optional(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  authorizeRegionAdmin(getRegionIdBySlug),
  async ({ configSlug, areaId, userStatus, body }, { session }: Ctx) => {
    const qaConfig = await db.qaConfig.findFirstOrThrow({
      where: { slug: configSlug },
    })

    const evaluation = await db.qaEvaluation.create({
      data: {
        configId: qaConfig.id,
        areaId,
        userStatus,
        body: body || null,
        evaluatorType: 'USER',
        userId: session.userId,
        systemStatus: 'NEEDS_REVIEW', // Default, will be updated by system
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

    return evaluation
  },
)
