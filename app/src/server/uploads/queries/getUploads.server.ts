import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { paginate } from '@/server/utils/paginate.server'

type GetUploadInput = Pick<Prisma.MapDatasetUploadFindManyArgs, 'where' | 'skip' | 'take'>

export type TUpload = Awaited<ReturnType<typeof getUploads>>['rows'][number]

export async function getUploads(input: GetUploadInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, skip, take } = input

  return paginate({
    skip,
    take,
    fallbackToLastPage: true,
    count: () => db.mapDatasetUpload.count({ where }),
    query: ({ skip, take }) =>
      db.mapDatasetUpload.findMany({
        skip,
        take,
        where,
        orderBy: [{ slug: 'asc' }, { id: 'asc' }],
        include: {
          regions: {
            select: {
              slug: true,
            },
          },
          // Layer-config rows power the admin list (count + categories per upload).
          layerConfigs: {
            select: { id: true, name: true, subId: true, categoryKey: true },
            orderBy: [{ subId: 'asc' }, { id: 'asc' }],
          },
        },
      }),
  })
}
