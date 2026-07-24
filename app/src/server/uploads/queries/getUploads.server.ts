import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { paginate } from '@/server/utils/paginate.server'

type GetUploadInput = Pick<Prisma.MapDatasetUploadFindManyArgs, 'where' | 'skip' | 'take'>

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

export type TUpload = Awaited<ReturnType<typeof getUploads>>['rows'][number]

export async function getUploads(input: GetUploadInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, skip, take } = input

  return paginate({
    skip,
    take,
    defaultTake: DEFAULT_TAKE,
    maxTake: MAX_TAKE,
    count: () => db.mapDatasetUpload.count({ where }),
    query: ({ skip, take }) =>
      db.mapDatasetUpload.findMany({
        skip,
        take,
        where,
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
