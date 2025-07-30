import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { QaConfigSchema } from '../schemas'

export default resolver.pipe(
  resolver.zod(QaConfigSchema),
  resolver.authorize('ADMIN'),
  async ({ id, ...input }) => {
    const qaConfig = await db.qaConfig.update({
      where: { id },
      data: input,
    })

    return qaConfig
  },
)
