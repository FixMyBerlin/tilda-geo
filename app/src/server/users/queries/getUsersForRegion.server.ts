import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'

const Schema = z.object({
  regionSlug: z.string(),
})

export async function getUsersForRegion(input: { regionSlug: string }, headers: Headers) {
  await requireAdmin(headers)

  const { regionSlug } = Schema.parse(input)
  const regionId = await getRegionIdBySlug(regionSlug)

  const users = await db.user.findMany({
    where: {
      memberships: {
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
      memberships: {
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
}
