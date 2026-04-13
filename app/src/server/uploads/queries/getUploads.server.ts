import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

type GetUploadInput = Pick<Prisma.UploadFindManyArgs, 'where' | 'skip' | 'take'>

export type TUpload = Awaited<ReturnType<typeof getUploads>>['uploads'][number]

export async function getUploads(input: GetUploadInput = {}, headers: Headers) {
  await requireAdmin(headers)

  const { where, skip = 0, take = 250 } = input

  const [uploads, count] = await Promise.all([
    db.upload.findMany({
      skip,
      take,
      where,
      include: {
        regions: {
          select: {
            slug: true,
          },
        },
      },
    }),
    db.upload.count({ where }),
  ])

  const hasMore = skip + take < count
  const nextPage = hasMore ? { skip: skip + take, take } : null

  return {
    uploads,
    nextPage,
    hasMore,
    count,
  }
}
