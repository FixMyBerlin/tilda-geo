import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const DeleteUpload = z.object({
  uploadSlug: z.string(),
})

export default resolver.pipe(
  resolver.zod(DeleteUpload),
  resolver.authorize('ADMIN'),
  async ({ uploadSlug }) => {
    return await db.upload.delete({
      where: { slug: uploadSlug },
    })
  },
)
