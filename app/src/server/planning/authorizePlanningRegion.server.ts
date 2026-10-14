import { AuthorizationError } from '@/server/auth/errors'
import type { SessionActor } from '@/server/auth/types'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

/**
 * Member check plus the region's `spaceFinderEnabled` flag, for every planning server function.
 * The flag also applies to admins, like in `deriveAvailableModes`; the route check alone does not
 * stop direct server-function calls.
 */
export async function authorizePlanningRegion(session: SessionActor, regionSlug: string) {
  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  const region = await db.region.findFirstOrThrow({
    where: { slug: regionSlug },
    select: { spaceFinderEnabled: true },
  })
  if (!region.spaceFinderEnabled) {
    throw new AuthorizationError('Flächenfinder is not enabled for this region')
  }
}
