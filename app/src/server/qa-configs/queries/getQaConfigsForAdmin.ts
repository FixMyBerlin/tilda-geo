import db from '@/db'
import { resolver } from '@blitzjs/rpc'

export default resolver.pipe(resolver.authorize('ADMIN'), async () => {
  const qaConfigs = await db.qaConfig.findMany({
    include: {
      region: true,
      _count: {
        select: { qaEvaluations: true },
      },
    },
    orderBy: [{ regionId: 'asc' }, { slug: 'asc' }],
  })

  return qaConfigs
})
