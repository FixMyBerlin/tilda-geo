import { getRequestURL, redirect } from 'h3'
import { definePlugin } from 'nitro'

// Ensure that we use the non-www route consistently
export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const canonicalOrigin = process.env.VITE_APP_ORIGIN as string
    const canonicalUrl = new URL(canonicalOrigin)
    if (canonicalUrl.hostname.toLowerCase().startsWith('www.')) return

    const wwwHost = `www.${canonicalUrl.hostname}`
    const url = getRequestURL(event)
    if (url.hostname !== wwwHost) return

    const target = new URL(url.pathname + url.search + url.hash, canonicalOrigin)
    throw redirect(target.toString(), 301)
  })
})
