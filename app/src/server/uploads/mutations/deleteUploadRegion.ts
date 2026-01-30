import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const DeleteUploadRegion = z.object({
  uploadSlug: z.string(),
  regionSlug: z.string(),
})

export default resolver.pipe(
  resolver.zod(DeleteUploadRegion),
  resolver.authorize('ADMIN'),
  async ({ uploadSlug, regionSlug }) => {
    return await db.upload.update({
      where: { slug: uploadSlug },
      data: {
        regions: {
          disconnect: { slug: regionSlug },
        },
      },
    })
  },
)
