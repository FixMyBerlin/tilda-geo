import { getRequestHeaders } from '@tanstack/react-start/server'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { requireOsmAccessToken } from '@/server/auth/osmAccessToken.server'

export async function createOsmNote(input: { lat: number; lon: number; text: string }) {
  const headers = getRequestHeaders()
  const accessToken = await requireOsmAccessToken(headers)

  const apiUrl = getOsmApiUrl('/notes.json')
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      lat: input.lat,
      lon: input.lon,
      text: input.text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to create OSM note: ${response.status} ${response.statusText}. ${errorText}`,
    )
  }

  return response.json()
}
