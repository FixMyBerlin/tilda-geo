import { $ } from 'bun'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'
import { triggerPrivateApi } from './externalTriggers'

export async function updateCache() {
  // Cache handling is based on ngnix which we don't run locally.
  // We had issues with the cache not being cleared on the server and it's not worth to port the fix to local when it does not do anything, actually.
  if (isDev) {
    console.log('Finishing up: ⏩ Skipping cache handling on development')
    return
  }

  await clearCache()
  await triggerCacheWarming()
}

/**
 * Clears the cache of the nginx server.
 * See `cache_proxy/.README.md` for details.
 */
export async function clearCache() {
  try {
    const sizeBeforeStr = await $`du -sh /cache_nginx_proxy`.text()
    // Corresponts to `docker-compose.yml` processing.volumes
    await $`rm -rf /cache_nginx_proxy/*`
    const sizeAfterStr = await $`du -sh /cache_nginx_proxy`.text()
    console.log(
      'Finishing up: Successfully cleared the cache ',
      `(before ${sizeBeforeStr.trim()} – after ${sizeAfterStr.trim()})`,
    )
  } catch (error) {
    console.warn('[ERROR] Finishing up: ⚠️ Clearing the cache failed:', error)
  }
}

export async function triggerCacheWarming() {
  if (params.skipWarmCache) {
    console.log('Finishing up: ⏩ Skipping `triggerCacheWarming` due to `SKIP_WARM_CACHE=1`')
  } else {
    console.log('Finishing up: Trigger cache warming…')
    return triggerPrivateApi('warm-cache')
  }
}
