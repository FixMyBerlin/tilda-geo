import { getRequestURL, redirect } from 'h3'
import { definePlugin } from 'nitro'

// Ensure that we use the non-www route consistently
export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const appOrigin = new URL(process.env.VITE_APP_ORIGIN)
    const appHost = appOrigin.hostname.toLowerCase()

    if (appHost.startsWith('www.')) return

    const requestUrl = getRequestURL(event)
    const requestHost = requestUrl.hostname.toLowerCase()

    if (requestHost !== `www.${appHost}`) return

    const target = new URL(
      requestUrl.pathname + requestUrl.search + requestUrl.hash,
      appOrigin.href,
    ).toString()

    throw redirect(target, 301)
  })
})
