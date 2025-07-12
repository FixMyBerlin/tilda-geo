import { logPadded } from '../utils/logging'
import { ensureOAuthReady } from '../utils/oauth'
import { params } from '../utils/parameters'

/**
 * Initialize OAuth authentication if needed
 * This ensures we have a valid OAuth cookie before attempting any downloads
 */
export async function initializeOAuth() {
  logPadded('Processing: Geofabrik OAuth')

  if (params.useOAuth) {
    await ensureOAuthReady()
  } else {
    console.log('Geofabrik OAuth: ⏩ Skipping OAuth authentication – Username, Password missing')
  }
}
