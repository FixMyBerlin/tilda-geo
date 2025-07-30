import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configSlug, areaId, regionSlug }, { session }: Ctx) => {
    const { isAuthorized } = await checkRegionAuthorization(session, regionSlug)

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

    return evaluations
  },
)
