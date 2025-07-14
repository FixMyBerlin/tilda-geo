import { $ } from 'bun'
import { join } from 'path'
import { OSM_DOWNLOAD_DIR } from '../constants/directories.const'
import { params } from '../utils/parameters'

//Geofabrik OAuth base URL, https://github.com/geofabrik/sendfile_osm_oauth_protector/blob/master/doc/client.md
const GEOFABRIK_OAUTH_BASE_URL = 'https://osm-internal.download.geofabrik.de'

export const COOKIE_FILE = join(OSM_DOWNLOAD_DIR, 'geofabrik_oauth_cookie.txt')
const OAUTH_SETTINGS_FILE = join(OSM_DOWNLOAD_DIR, 'oauth_settings.json')

/**
 * Ensure we have a valid OAuth cookie, getting a new one if needed
 * Returns true if OAuth is ready, false if OAuth is disabled
 * If OAuth fails, falls back to public download by modifying params
 */
export async function ensureOAuthReady() {
  if ((await hasValidOAuthCookie()).isValid) {
    console.log('Geofabrik OAuth: OAuth is ready with existing cookie')
    return true
  }

  await createOAuthCookie()
  if ((await hasValidOAuthCookie()).isValid) {
    console.log('Geofabrik OAuth: OAuth is ready with fresh cookie')
    return true
  }

  console.log('Geofabrik OAuth: OAuth initialization failed; falling back to public data')
  params.pbfDownloadUrl = params.pbfDownloadUrl
    .replaceAll('osm-internal.download.geofabrik.de', 'download.geofabrik.de')
    .replaceAll('-internal', '')
  params.osmUsername = undefined
  params.osmPassword = undefined
  return false
}

/**
 * Check if we have a valid OAuth cookie and return cookie information
 * Returns { isValid: boolean, cookiePath?: string, cookieContent?: string, httpCookie?: string }
 */
export async function hasValidOAuthCookie() {
  if (!(params.osmUsername && params.osmPassword)) {
    return { isValid: false } as const
  }

  try {
    const cookieContent = await getCookieFile()
    if (!cookieContent) {
      console.log('[ERROR] Geofabrik OAuth: getCookieFile failed')
      return { isValid: false } as const
    }

    // Parse the Netscape cookie format
    const httpCookie = parseNetscapeCookie(cookieContent)
    if (!httpCookie) {
      console.log('[ERROR] Geofabrik OAuth: parseNetscapeCookie failed')
      return { isValid: false } as const
    }

    // Check if cookie is valid using the cookie status API
    const statusUrl = `${GEOFABRIK_OAUTH_BASE_URL}/cookie_status`
    const response = await fetch(statusUrl, {
      headers: {
        Cookie: httpCookie,
      },
    })

    if (response.ok) {
      const status = await response.json()
      const isValid = status.cookie_status === 'valid'
      if (isValid) {
        console.log('Geofabrik OAuth: Valid cookie present')
        return {
          isValid: true,
          cookiePath: COOKIE_FILE,
          cookieContent,
          httpCookie,
        } as const
      } else {
        console.log('[ERROR] Geofabrik OAuth: Cookie validation failed.', JSON.stringify(status))
      }
    } else {
      console.log('[ERROR] Geofabrik OAuth: Cookie status API request failed.', response)
    }
    return { isValid: false } as const
  } catch (error) {
    console.error('[ERROR] Geofabrik OAuth: Could not verify cookie status:', error)
    return { isValid: false } as const
  }
}

/**
 * Create and store OAuth cookie using the Geofabrik client
 * This will authenticate with OSM and get a cookie for authenticated downloads
 */
async function createOAuthCookie() {
  if (params.osmUsername && params.osmPassword) {
    console.log('Geofabrik OAuth: Create new cookie…')
  } else {
    console.log('Geofabrik OAuth: ⏩ Skipping cookie creation – usename, passwort missing')
    return
  }

  try {
    // Create settings file
    await createOAuthSettings()

    // Run the OAuth client to get the cookie
    const result =
      await $`python3 /usr/local/bin/oauth_cookie_client.py -o ${COOKIE_FILE} -s ${OAUTH_SETTINGS_FILE} -f netscape`.quiet()

    if (result.exitCode === 0) {
      console.log('Geofabrik OAuth: New Cookie saved')
    } else {
      console.error(
        '[ERROR] Geofabrik OAuth: OAuth authentication failed with exit code',
        result.exitCode,
        result,
      )
      throw new Error(`OAuth authentication failed with exit code ${result.exitCode}`)
    }
  } catch (error) {
    console.error('[ERROR] Geofabrik OAuth: createOAuthCookie failed', error)
    throw error
  }
}

/**
 * Create OAuth settings file for the Geofabrik client
 */
async function createOAuthSettings() {
  if (!params.osmUsername || !params.osmPassword) {
    throw new Error('OAuth credentials are not configured.')
  }

  const settings = {
    user: params.osmUsername,
    password: params.osmPassword,
    osm_host: 'https://www.openstreetmap.org',
    consumer_url: `${GEOFABRIK_OAUTH_BASE_URL}/get_cookie`,
  }

  await Bun.write(OAUTH_SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

/**
 * Parse Netscape cookie format and extract the cookie value for HTTP requests
 */
function parseNetscapeCookie(cookieContent: string) {
  const lines = cookieContent.split('\n')
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue

    const parts = line.split('\t')
    if (parts.length >= 7) {
      const cookieName = parts[5]
      const cookieValue = parts[6]
      return `${cookieName}=${cookieValue}`
    }
  }
  return null
}

/**
 * Get the cookie file if it exists, otherwise return null
 */
async function getCookieFile() {
  const cookieFile = Bun.file(COOKIE_FILE)
  if (await cookieFile.exists()) {
    return await cookieFile.text()
  }
  return null
}

/**
 * Get headers for HTTP requests, including OAuth cookie if enabled
 */
export function getAuthHeaders(httpCookie: string | undefined) {
  const headers: HeadersInit = {}

  if (httpCookie) {
    headers['Cookie'] = httpCookie
  }

  return headers
}
