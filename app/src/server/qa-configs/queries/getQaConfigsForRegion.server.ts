import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { canAccessQaForRegion } from '@/server/qa-configs/authorization/canAccessQaForRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
})

export async function getQaConfigsForRegion(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await getAppSession(headers)
  const { regionSlug } = Schema.parse(input)

  // Check authorization using the helper
  const { isAuthorized } = await canAccessQaForRegion(session, regionSlug)
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

  return qaConfigs
}
