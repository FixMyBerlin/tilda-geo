import { $ } from 'bun'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'

export async function triggerPrivateApi(endpoint: string, retryCount = 0) {
  const domain = isDev ? 'http://127.0.0.1:5173' : 'http://app:4000'
  const url = `${domain}/api/private/${endpoint}?apiKey=${params.apiKey}`
  const maxRetries = 10 // Retry for up to 10 minutes (10 retries × 1 minute)
  const retryDelayMs = 60 * 1000 // 1 minute between retries

  if (isDev) {
    console.info(
      'Finishing up: 👉 Action recommended:',
      'In DEV, the processing cannot trigger API calls. You should do this manually:',
      `curl "${url}"`,
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
        `[ERROR] Finishing up: ⚠️ Calling the ${endpoint} hook failed. This is likely due to the NextJS application not running.`,
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

    // Retry on connection errors (likely app container restarting)
    const isConnectionError =
      error instanceof Error &&
      (error.name === 'AbortError' ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('socket') ||
        error.message.includes('connection'))

    if (isConnectionError && retryCount < maxRetries) {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Failed to trigger ${endpoint} (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${retryDelayMs / 1000} seconds...`,
        error instanceof Error ? error.message : String(error),
      )
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      return triggerPrivateApi(endpoint, retryCount + 1)
    }

    // Log the error but don't crash the processing pipeline (no throw)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Request to ${endpoint} timed out after ${timeoutMs / 1000 / 60} minutes`,
      )
    } else {
      console.warn(
        `[ERROR] Finishing up: ⚠️ Failed to trigger ${endpoint} after ${retryCount + 1} attempts. Operation was not triggered and will not run.`,
        'Try callig it manually:',
        `curl "${url}"`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}

/**
 * Restarts the tiles container to refresh the /catalog endpoint.
 * This requires that the docker socket is mounted in this container.
 */
export async function restartTileServer() {
  try {
    await $`docker restart tiles > /dev/null`
    console.log('Finishing up: Succesfully restarted the tiles container.')
  } catch (error) {
    console.warn('[ERROR] Finishing up: ⚠️ Restarting the tiles container failed.', error)
    throw new Error(`Restarting the tiles container failed: ${error}`)
  }
}
