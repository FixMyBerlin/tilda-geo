import { z } from 'zod'
import db from '@/server/db.server'
import { authorizeSpaceFinderArea } from '../authorizeSpaceFinderRegion.server'
import { AreaIdInput } from '../schemas'

export async function getSpaceFinderArea(data: z.infer<typeof AreaIdInput>, headers: Headers) {
  await authorizeSpaceFinderArea(headers, data.areaId)
  return db.spaceFinderArea.findFirstOrThrow({
    where: { id: data.areaId },
    select: {
      id: true,
      title: true,
      studyArea: true,
      userDatasets: true,
      useCase: true,
      areaSizeM2: true,
      censusSaettigungEw: true,
      censusEwPerHa: true,
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
          jobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true },
          },
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { hexCount: true, stale: true, status: true },
          },
        },
      },
    },
  })
}
