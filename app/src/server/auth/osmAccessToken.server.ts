import db from '@/server/db.server'
import { auth } from './auth.server'
import { AuthorizationError } from './errors'
import { requireAuth } from './session.server'

/** Plain OSM access token of the signed-in user, for calls to the OSM API on the server. */
export async function requireOsmAccessToken(headers: Headers) {
  const { userId } = await requireAuth(headers)
  const account = await db.account.findFirst({
    where: { userId, providerId: 'osm' },
    select: { id: true },
  })
  if (!account) throw new AuthorizationError('OSM access token not available')

  const { accessToken } = await auth.api.getAccessToken({
    body: { accountId: account.id, userId },
  })
  if (!accessToken) throw new AuthorizationError('OSM access token not available')

  return accessToken
}
