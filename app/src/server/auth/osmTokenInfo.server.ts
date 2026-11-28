import { z } from 'zod'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'

// Doorkeeper's token info (https://github.com/doorkeeper-gem/doorkeeper/wiki/API-endpoint-descriptions-and-examples).
// Checked on 2026-11-24 with a real token of an OSM app: openstreetmap.org answers 200 with
// `resource_owner_id`, `scope`, `expires_in`, `application.uid` and `created_at`.
const OsmTokenInfoSchema = z.object({
  resource_owner_id: z.number(),
  application: z.object({ uid: z.string() }),
})

const OSM_TOKEN_INFO_TIMEOUT_MS = 5000

type OsmTokenInfoResult =
  | { ok: true; osmId: number; osmClientId: string }
  | { ok: false; status: number }

/**
 * Who an OSM OAuth2 access token belongs to (`resource_owner_id` = OSM user id) and which OSM
 * application it was issued to (`application.uid` = client id), from `/oauth2/token/info`. Needs
 * no OAuth scope. Used by the external API token exchange. The access token is only passed on to
 * OSM — never store or log it. Throws on a network error, a timeout or a redirect; a response that is not the expected
 * shape is `{ ok: false, status: 502 }`.
 */
export async function fetchOsmTokenInfo(accessToken: string): Promise<OsmTokenInfoResult> {
  const response = await fetch(getOsmUrl('/oauth2/token/info'), {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    // The Bearer token must never be sent to another host, and OSM must not hold a request open.
    redirect: 'error',
    signal: AbortSignal.timeout(OSM_TOKEN_INFO_TIMEOUT_MS),
  })

  if (!response.ok) {
    return { ok: false, status: response.status }
  }

  const parsed = OsmTokenInfoSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    return { ok: false, status: 502 }
  }
  return {
    ok: true,
    osmId: parsed.data.resource_owner_id,
    osmClientId: parsed.data.application.uid,
  }
}
