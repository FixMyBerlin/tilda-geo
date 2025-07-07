import { $ } from 'bun'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'
import { triggerPrivateApi } from './externalTriggers'

export async function updateCache() {
  // Cache handling is based on ngnix which we don't run locally.
  // We had issues with the cache not being cleared on the server and it's not worth to port the fix to local when it does not do anything, actually.
  if (isDev) {
    console.log('⏩ Skipping cache handling on development')
    return
  }

  await clearCache()
  await triggerCacheWarming()
}

/**
 * Clears the cache of the nginx server.
 * This requires the /var/cache/nginx directory from the nginx container to be mounted in this container.
 */
export async function clearCache() {
  try {
    const sizeBeforeStr = await $`du -sh /srv/cache`.text()
    await $`rm -rf /srv/cache/*`
    const sizeAfterStr = await $`du -sh /srv/cache`.text()
    console.log(
      'Cache:',
      'Succesfully cleared the cache.',
      `Size before: ${sizeBeforeStr}, after: ${sizeAfterStr}`,
    )
  } catch (error) {
    console.warn('⚠️ Clearing the cache failed:', error)
  }
}

export async function triggerCacheWarming() {
  if (params.skipWarmCache) {
    console.log('⏩ Skipping `triggerCacheWarming` due to `SKIP_WARM_CACHE=1`')
  } else {
    console.log('Cache:', 'Trigger cache warming')
    return triggerPrivateApi('warm-cache')
  }
}
