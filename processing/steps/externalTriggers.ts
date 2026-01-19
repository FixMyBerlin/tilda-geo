import { $ } from 'bun'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'

export async function triggerPrivateApi(endpoint: string) {
  const domain = isDev ? 'http://127.0.0.1:5173' : 'http://app:4000'
  const url = `${domain}/api/private/${endpoint}?apiKey=${params.apiKey}`

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
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000 / 60} minutes`)
    }
    throw error
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
