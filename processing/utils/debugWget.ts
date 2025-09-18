import { isDev } from './isDev'
import { params } from './parameters'

/**
 * Logs a debug wget command with redirect parameters for debugging purposes.
 * Only logs when in development mode.
 *
 * @param cookieCheck - OAuth cookie information from ensureOAuthReady()
 * @param context - Optional context string to identify where the debug log comes from
 */
export function debugWgetCommand(cookieCheck?: any, context?: string) {
  if (!isDev) return

  const cookieHeader =
    cookieCheck?.isValid && cookieCheck.httpCookie
      ? ` --header "Cookie: ${cookieCheck.httpCookie}"`
      : ''

  const contextPrefix = context ? `[DEBUG] ${context}: ` : '[DEBUG] '

  console.log(
    `${contextPrefix}wget --spider --server-response --max-redirect=10${cookieHeader} ${params.pbfDownloadUrl}`,
  )
}
