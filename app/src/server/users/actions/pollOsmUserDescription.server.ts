import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { auth } from '@/server/auth/auth.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'

/**
 * Polls OSM API to check if user has updated their description.
 * Returns the description if found, null otherwise.
 * This is used for client-side polling after user updates their OSM profile.
 */
export async function pollOsmUserDescription() {
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

  const data = await response.json()
  return data.user?.description?.trim() || null
}
