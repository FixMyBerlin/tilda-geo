import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { qaConfigsInRegionWhere } from '@/server/regions/regionScopedWhere'
import { optionalTrimmed } from '@/server/utils/searchString'

export async function getQaConfigsForAdmin(input: { regionSlug?: string }, headers: Headers) {
  await requireAdmin(headers)

  const regionSlug = optionalTrimmed(input.regionSlug)
  const qaConfigs = await db.qaConfig.findMany({
    where: regionSlug ? qaConfigsInRegionWhere(regionSlug) : undefined,
    include: {
      region: true,
      _count: {
        select: { qaEvaluations: true },
      },
    },
    orderBy: [{ regionId: 'asc' }, { slug: 'asc' }],
  })

  return qaConfigs
}
