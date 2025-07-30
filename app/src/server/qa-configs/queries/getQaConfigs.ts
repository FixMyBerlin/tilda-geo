import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { GetQaConfigsSchema } from '../schemas'

export default resolver.pipe(
  resolver.zod(GetQaConfigsSchema),
  resolver.authorize('ADMIN'),
  async ({ regionId }) => {
    const qaConfigs = await db.qaConfig.findMany({
      where: regionId ? { regionId } : undefined,
      include: {
        region: true,
        _count: {
          select: {
            qaEvaluations: true,
          },
        },
      },
      orderBy: [{ regionId: 'asc' }, { slug: 'asc' }],
    })

    return qaConfigs
  },
)
