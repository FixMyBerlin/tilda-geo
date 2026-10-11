import { z } from 'zod'
import { type MemberCaller, getMemberSession } from '@/server/auth/memberCaller.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { parseQaConfigRow } from '../utils/parseQaConfigIndicators'

const Schema = z.object({
  regionSlug: z.string(),
})

export async function getQaConfigsForRegion(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await getMemberSession(caller)
  const { regionSlug } = Schema.parse(input)

  // Check authorization using the helper
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) {
    return []
  }

  // Get QA configs for the region
  const qaConfigs = await db.qaConfig.findMany({
    where: {
      region: { slug: regionSlug },
    },
    include: {
      region: true,
      _count: {
        select: { qaEvaluations: true },
      },
    },
    orderBy: [
      { isActive: 'desc' }, // Active first
      { createdAt: 'desc' }, // Newest first
    ],
  })

  return qaConfigs.map(parseQaConfigRow)
}
