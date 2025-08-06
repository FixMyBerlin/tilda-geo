import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { DeleteQaConfigSchema } from '../schemas'

export default resolver.pipe(
  resolver.zod(DeleteQaConfigSchema),
  resolver.authorize('ADMIN'),
  async ({ id }) => {
    const qaConfig = await db.qaConfig.delete({
      where: { id },
    })

    return qaConfig
  },
)
