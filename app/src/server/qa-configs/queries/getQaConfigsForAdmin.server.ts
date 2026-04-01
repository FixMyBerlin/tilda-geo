import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export async function getQaConfigsForAdmin(headers: Headers) {
  await requireAdmin(headers)

  const qaConfigs = await db.qaConfig.findMany({
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
