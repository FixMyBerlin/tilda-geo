import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  regionSlug: z.string(),
})

export default resolver.pipe(resolver.zod(Schema), async ({ regionSlug }, { session }: Ctx) => {
  // Check authorization using the helper
  const { isAuthorized } = await checkRegionAuthorization(session, regionSlug)
  if (!isAuthorized) {
    return []
  }

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
})
