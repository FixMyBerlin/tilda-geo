import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { auth } from '@/server/auth/auth.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'

export async function getOsmUserDetails() {
  const headers = getRequestHeaders()
  const appSession = await requireAuth(headers)

  const tokenResponse = await auth.api.getAccessToken({
    body: { providerId: 'osm', userId: appSession.userId.toString() },
    headers,
  })

  if (!tokenResponse?.accessToken) {
    throw new AuthorizationError('OSM access token not available')
  }

  const apiUrl = getOsmApiUrl('/user/details.json')
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResponse.accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch OSM user details: ${response.status} ${response.statusText}. ${errorText}`,
    )
  }

  return response.json()
}
