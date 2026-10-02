import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'

type OsmUserDetailsResult =
  | {
      ok: true
      user: {
        osmId: number
        osmName: string
        osmDescription: string | undefined
        osmAvatar: string | null
      }
    }
  | { ok: false; status: number; statusText: string; errorText: string }

/**
 * Who an OSM OAuth2 access token belongs to (`/user/details.json`, needs the `read_prefs` scope).
 * Used by the OSM login and by the external API token exchange. The access token is only passed
 * on to OSM — never store or log it.
 */
export async function fetchOsmUserDetails(accessToken: string): Promise<OsmUserDetailsResult> {
  const response = await fetch(getOsmApiUrl('/user/details.json'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      errorText: await response.text(),
    }
  }

  const json = await response.json()
  if (!json.user) {
    return {
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      errorText: 'No user object in response',
    }
  }

  const user = json.user
  return {
    ok: true,
    user: {
      osmId: Number(user.id),
      osmName: user.display_name,
      osmDescription: user.description,
      osmAvatar: user.img?.href || null,
    },
  }
}
