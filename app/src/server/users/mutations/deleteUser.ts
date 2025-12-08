import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const Schema = z.object({
  userId: z.number(),
})

export default resolver.pipe(
  resolver.authorize('ADMIN'),
  resolver.zod(Schema),
  async ({ userId }) => {
    await db.user.delete({
      where: { id: userId },
    })

    return { success: true }
  },
)
