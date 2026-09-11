import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { auth } from '@/server/auth/auth.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'

/**
 * Shared POST helper for OSM API v0.6 write endpoints (create/comment/close/reopen note) that
 * reuse the app's OSM OAuth `write_notes` token.
 */
export async function osmApiPost(path: string, body: Record<string, unknown>, errorLabel: string) {
  const headers = getRequestHeaders()
  const appSession = await requireAuth(headers)

  const tokenResponse = await auth.api.getAccessToken({
    body: { providerId: 'osm', userId: appSession.userId.toString() },
    headers,
  })

  if (!tokenResponse?.accessToken) {
    throw new AuthorizationError('OSM access token not available')
  }

  const apiUrl = getOsmApiUrl(path)
  const response = await fetch(apiUrl, {
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
      `Failed to ${errorLabel}: ${response.status} ${response.statusText}. ${errorText}`,
    )
  }

  return response.json()
}
