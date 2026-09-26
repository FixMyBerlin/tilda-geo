import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { auth } from '@/server/auth/auth.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'

/** POST to an OSM API notes endpoint with the user's OSM OAuth token (`write_notes`). */
export async function postOsmNote(path: string, body: Record<string, unknown>) {
  const headers = getRequestHeaders()
  const appSession = await requireAuth(headers)

  const tokenResponse = await auth.api.getAccessToken({
    body: { providerId: 'osm', userId: appSession.userId.toString() },
    headers,
  })

  if (!tokenResponse?.accessToken) {
    throw new AuthorizationError('OSM access token not available')
  }

  const response = await fetch(getOsmApiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResponse.accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `OSM API ${path} failed: ${response.status} ${response.statusText}. ${errorText}`,
    )
  }
}
