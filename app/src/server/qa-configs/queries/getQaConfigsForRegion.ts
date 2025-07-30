import db from '@/db'
import { authorizeRegionAdmin } from '@/src/server/authorization/authorizeRegionAdmin'
import getRegionIdBySlug from '@/src/server/regions/queries/getRegionIdBySlug'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const Schema = z.object({
  regionSlug: z.string(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  authorizeRegionAdmin(getRegionIdBySlug),
  async ({ regionSlug }) => {
    // Get QA configs for the region
    const qaConfigs = await db.qaConfig.findMany({
      where: {
        region: { slug: regionSlug },
      },
      include: {
        region: true,
        _count: {
          select: { qaEvaluations: true },
        },
      },
      orderBy: [
        { isActive: 'desc' }, // Active first
        { createdAt: 'desc' }, // Newest first
      ],
    })

    return qaConfigs
  },
)
