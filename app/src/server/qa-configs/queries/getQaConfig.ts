import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { NotFoundError } from 'blitz'
import { GetQaConfigSchema } from '../schemas'

export default resolver.pipe(
  resolver.zod(GetQaConfigSchema),
  resolver.authorize('ADMIN'),
  async ({ id }) => {
    const qaConfig = await db.qaConfig.findFirst({
      where: { id },
      include: {
        region: true,
      },
    })

    if (!qaConfig) throw new NotFoundError()

    return qaConfig
  },
)
