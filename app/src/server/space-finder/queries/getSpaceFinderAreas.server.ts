import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'
import { RegionSlugInput } from '../schemas'

export async function getSpaceFinderAreas(data: z.infer<typeof RegionSlugInput>, headers: Headers) {
  const session = await requireAuth(headers)
  await authorizeSpaceFinderRegion(session, data.regionSlug)
  const regionId = await getRegionIdBySlug(data.regionSlug)
  return db.spaceFinderArea.findMany({
    where: { regionId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      inputUpdatedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, osmName: true } },
      variants: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          currentRunId: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: { id: true, osmName: true } },
          jobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true },
          },
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { hexCount: true, stale: true, status: true, createdAt: true },
          },
        },
      },
    },
  })
}
