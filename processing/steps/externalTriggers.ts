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

  const response = await fetch(url)
  if (!response.ok) {
    console.warn(
      `[ERROR] Finishing up: ⚠️ Calling the ${endpoint} hook failed. This is likely due to the NextJS application not running.`,
      response.status,
    )
  }
}

export async function triggerPostProcessing() {
  return triggerPrivateApi('post-processing-hook')
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
