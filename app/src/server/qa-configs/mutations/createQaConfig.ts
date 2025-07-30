import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { QaConfigSchema } from '../schemas'

export default resolver.pipe(
  resolver.zod(QaConfigSchema),
  resolver.authorize('ADMIN'),
  async (input) => {
    const qaConfig = await db.qaConfig.create({
      data: input,
    })

    return qaConfig
  },
)
