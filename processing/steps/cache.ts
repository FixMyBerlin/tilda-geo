import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'
import { triggerPrivateApi } from './externalTriggers'
import { $ } from 'bun'
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

/** Matches `docker-compose.yml` processing.volumes mount for cache clearing. */
const CACHE_NGINX_PROXY_DIR = '/cache_nginx_proxy'

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
    // Check if the cache directory exists first
    const dirCheck = await $`test -d ${CACHE_NGINX_PROXY_DIR}`.nothrow()
    if (dirCheck.exitCode !== 0) {
      console.log(
        `Finishing up: ⏩ Cache directory ${CACHE_NGINX_PROXY_DIR} does not exist, skipping cache clearing`,
      )
      return
    }

    const entries = await readdir(CACHE_NGINX_PROXY_DIR)
    if (entries.length === 0) {
      console.log(
        `Finishing up: ⏩ Cache directory ${CACHE_NGINX_PROXY_DIR} is empty (no cached files yet — e.g. nginx has not served tiles to disk). Nothing to clear; this is OK.`,
      )
      return
    }

    const sizeBeforeStr = await $`du -sh ${CACHE_NGINX_PROXY_DIR}`.text()
    for (const name of entries) {
      await rm(join(CACHE_NGINX_PROXY_DIR, name), {
        recursive: true,
        force: true,
      })
    }
    const sizeAfterStr = await $`du -sh ${CACHE_NGINX_PROXY_DIR}`.text()
    console.log(
      'Finishing up: Successfully cleared the cache ',
      `(before ${sizeBeforeStr.trim()} – after ${sizeAfterStr.trim()})`,
    )
  } catch (error) {
    console.warn('[WARNING] Finishing up: ⚠️ Clearing the cache failed:', error)
  }
}

export async function triggerCacheWarming() {
  if (params.skipWarmCache) {
    console.log('Finishing up: ⏩ Skipping `triggerCacheWarming` due to `SKIP_WARM_CACHE=1`')
  } else {
    console.log('Finishing up: Trigger async cache warming…')
    return triggerPrivateApi('warm-cache')
  }
}
