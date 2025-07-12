import { logPadded } from '../utils/logging'
import { ensureOAuthReady } from '../utils/oauth'

/**
 * Initialize OAuth authentication if needed
 * This ensures we have a valid OAuth cookie before attempting any downloads
 */
export async function initializeOAuth() {
  logPadded('Processing: Geofabrik OAuth')

  // Check if everything is set up for OAuth
  // … or fall back to pulic data.
  await ensureOAuthReady()
}
