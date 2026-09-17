import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
})

/** OSM display names of users with a Membership in this region (not TILDA logins without membership). */
export async function getRegionMemberOsmNames(input: { regionSlug: string }, headers: Headers) {
  const { regionSlug } = Schema.parse(input)
  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) return []

  const users = await db.user.findMany({
    where: {
      osmName: { not: null },
      memberships: { some: { region: { slug: regionSlug } } },
    },
    select: { osmName: true },
  })

  return users.flatMap((user) => (user.osmName ? [user.osmName] : []))
}
