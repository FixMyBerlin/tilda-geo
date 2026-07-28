import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'

/** Bun/Node connection failures that should retry while the app container restarts. */
function isRetryableConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket') ||
    message.includes('connection') ||
    // Bun: "Unable to connect. Is the computer able to access the url?"
    message.includes('unable to connect') ||
    // Bun: "Was there a typo in the url or port?"
    message.includes('typo in the url')
  )
}

export async function triggerPrivateApi(endpoint: string, retryCount = 0) {
  const domain = isDev ? 'http://127.0.0.1:5173' : 'http://app:4000'
  const privateApiUrl = `${domain}/api/private/${endpoint}`
  const url = `${privateApiUrl}?apiKey=${params.apiKey}`
  const redactedCurlCommand = `curl "${privateApiUrl}?apiKey=***"`
  const maxRetries = 10 // Retry for up to 10 minutes (10 retries × 1 minute)
  const retryDelayMs = 60 * 1000 // 1 minute between retries

  if (isDev) {
    console.info(
      'Finishing up: 👉 Action recommended:',
      'In DEV, the processing cannot trigger API calls. You should do this manually:',
      redactedCurlCommand,
    )
    return
  }

  // Set a 15 minute timeout for long-running operations like cache warming and QA updates
  const timeoutMs = 15 * 60 * 1000 // 15 minutes
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!response.ok) {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Calling the ${endpoint} hook failed. This is likely due to the app container not running.`,
        response.status,
      )
    } else {
      if (retryCount > 0) {
        console.log(
          `Finishing up: ✓ Successfully triggered ${endpoint} after ${retryCount} retry${retryCount > 1 ? 's' : ''}`,
        )
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)

    // Our AbortController timeout is not a transient connection blip — do not retry it.
    const timedOutByUs =
      error instanceof Error && error.name === 'AbortError' && controller.signal.aborted

    if (!timedOutByUs && isRetryableConnectionError(error) && retryCount < maxRetries) {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Failed to trigger ${endpoint} (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${retryDelayMs / 1000} seconds...`,
        error instanceof Error ? error.message : String(error),
      )
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      return triggerPrivateApi(endpoint, retryCount + 1)
    }

    // Log the error but don't crash the processing pipeline (no throw)
    if (timedOutByUs) {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Request to ${endpoint} timed out after ${timeoutMs / 1000 / 60} minutes`,
      )
    } else {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Failed to trigger ${endpoint} after ${retryCount + 1} attempts. Operation was not triggered and will not run.`,
        'Try calling it manually:',
        redactedCurlCommand,
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}
