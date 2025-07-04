import { $ } from 'bun'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'

async function triggerPrivateApi(endpoint: string) {
  const domain = isDev ? 'http://127.0.0.1:5173' : 'http://app:4000'
  const url = `${domain}/api/private/${endpoint}?apiKey=${params.apiKey}`

  if (isDev) {
    console.info(
      '👉 Action recommended:',
      'In DEV, the processing cannot trigger API calls. You should do this manually:',
      `curl "${url}"`,
    )
    return
  }

  const response = await fetch(url)
  if (!response.ok) {
    console.warn(
      `⚠️ Calling the ${endpoint} hook failed. This is likely due to the NextJS application not running.`,
      response.status,
    )
  }
}

export async function triggerPostProcessing() {
  return triggerPrivateApi('post-processing-hook')
}
export async function triggerCacheWarming() {
  if (params.skipWarmCache) {
    console.log('⏩ Skipping `triggerCacheWarming` due to `SKIP_WARM_CACHE=1`')
  } else {
    console.log('Cache:', 'Trigger cache warming')
    return triggerPrivateApi('warm-cache')
  }
}

/**
 * Clears the cache of the nginx server.
 * This requires the /var/cache/nginx directory from the nginx container to be mounted in this container.
 */
export async function clearCache() {
  try {
    const { stdout: sizeBefore } = await $`du -sh /var/cache/nginx`
    const sizeBeforeStr = sizeBefore.toString().trim()
    const { stdout: sizeAfter } = await $`du -sh /var/cache/nginx`
    const sizeAfterStr = sizeAfter.toString().trim()
    await $`rm -rf /srv/cache/*`
    console.log(
      'Cache:',
      `Succesfully cleared the cache. Size before: ${sizeBeforeStr}, after: ${sizeAfterStr}`,
    )
  } catch (error) {
    console.warn('⚠️ Clearing the cache failed:', error)
  }
}

/**
 * Restarts the tiles container to refresh the /catalog endpoint.
 * This requires that the docker socket is mounted in this container.
 */
export async function restartTileServer() {
  try {
    await $`docker restart tiles > /dev/null`
    console.log('Succesfully restarted the tiles container.')
  } catch (error) {
    throw new Error(`Restarting the tiles container failed: ${error}`)
  }
}
