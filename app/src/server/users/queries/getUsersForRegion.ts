import db from '@/db'
import getRegionIdBySlug from '@/src/server/regions/queries/getRegionIdBySlug'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const Schema = z.object({
  regionSlug: z.string(),
})

export default resolver.pipe(
  resolver.authorize('ADMIN'),
  resolver.zod(Schema),
  async ({ regionSlug }) => {
    const regionId = await getRegionIdBySlug(regionSlug)

    const users = await db.user.findMany({
      where: {
        Membership: {
          some: {
            regionId,
          },
        },
      },
      select: {
        id: true,
        osmId: true,
        osmName: true,
        firstName: true,
        lastName: true,
        email: true,
        Membership: {
          select: {
            id: true,
            region: {
              select: {
                slug: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return users
  },
)
