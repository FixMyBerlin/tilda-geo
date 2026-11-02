import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { requireOsmAccessToken } from '@/server/auth/osmAccessToken.server'
import { updateOsmDescription } from '../mutations/updateOsmDescription.server'

async function fetchTrimmedOsmUserDescription(headers: Headers) {
  const accessToken = await requireOsmAccessToken(headers)

  const apiUrl = getOsmApiUrl('/user/details.json')
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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

/** Fetches trimmed OSM profile description; if non-empty, stores it on the user row. */
export async function persistOsmUserDescriptionIfPresent() {
  const headers = getRequestHeaders()
  const description = await fetchTrimmedOsmUserDescription(headers)
  if (!description) return false
  await updateOsmDescription({ osmDescription: description }, headers)
  return true
}
