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

  // Admins always have access
  if (session?.role === 'ADMIN') {
    return { isAuthorized: true, regionId: region.id }
  }

  // DEACTIVATED: Only admins (already checked above)
  if (region.status === 'DEACTIVATED') {
    return { isAuthorized: false }
  }

  // PUBLIC: Anyone can access
  if (region.status === 'PUBLIC') {
    return { isAuthorized: true, regionId: region.id }
  }

  // PRIVATE: Only members can access
  if (region.status === 'PRIVATE') {
    if (!session?.userId) {
      return { isAuthorized: false }
    }
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
