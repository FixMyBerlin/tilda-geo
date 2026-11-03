import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'
import type { SessionActor } from '@/server/auth/types'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

/**
 * Member check plus the region's `spaceFinderEnabled` flag, for every Flächenfinder server function.
 * The flag also applies to admins, like in `deriveAvailableModes`; the route check alone does not
 * stop direct server-function calls.
 */
export async function authorizeSpaceFinderRegion(session: SessionActor, regionSlug: string) {
  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  const region = await db.region.findFirstOrThrow({
    where: { slug: regionSlug },
    select: { spaceFinderEnabled: true },
  })
  if (!region.spaceFinderEnabled) {
    throw new AuthorizationError('Flächenfinder is not enabled for this region')
  }
}

export async function authorizeSpaceFinderArea(headers: Headers, areaId: number) {
  const session = await requireAuth(headers)
  const area = await db.spaceFinderArea.findFirstOrThrow({
    where: { id: areaId },
    select: { id: true, region: { select: { slug: true } } },
  })
  await authorizeSpaceFinderRegion(session, area.region.slug)
  return session
}

export async function authorizeSpaceFinderVariant(headers: Headers, variantId: number) {
  const session = await requireAuth(headers)
  const variant = await db.spaceFinderVariant.findFirstOrThrow({
    where: { id: variantId },
    select: { id: true, area: { select: { region: { select: { slug: true } } } } },
  })
  await authorizeSpaceFinderRegion(session, variant.area.region.slug)
  return session
}
