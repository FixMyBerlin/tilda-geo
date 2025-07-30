import db from '@/db'
import { Ctx } from 'blitz'

export async function checkRegionAuthorization(session: Ctx['session'], regionSlug: string) {
  // Get the region
  const region = await db.region.findFirst({
    where: { slug: regionSlug },
  })

  if (!region) {
    return { isAuthorized: false }
  }

  if (session?.role === 'ADMIN') {
    return { isAuthorized: true, regionId: region.id }
  }

  if (session?.userId) {
    const membership = await db.membership.findFirst({
      where: {
        userId: session.userId,
        regionId: region.id,
      },
    })
    return { isAuthorized: !!membership, regionId: region.id }
  }

  return { isAuthorized: false }
}
