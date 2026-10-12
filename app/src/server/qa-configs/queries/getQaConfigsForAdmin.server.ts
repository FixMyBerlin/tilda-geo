import { type MemberCaller, requireAdminSession } from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { qaConfigsInRegionWhere } from '@/server/regions/regionScopedWhere'
import { optionalTrimmed } from '@/server/utils/searchString'
import { parseQaConfigRow } from '../utils/parseQaConfigIndicators'

export async function getQaConfigsForAdmin(input: { regionSlug?: string }, caller: MemberCaller) {
  await requireAdminSession(caller)

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

  return qaConfigs.map(parseQaConfigRow)
}
