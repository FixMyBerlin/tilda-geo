import type { Plugin } from 'vite'

/**
 * Vite's dev server routes requests by `Sec-Fetch-Dest`: only document-like destinations are
 * forwarded to the SSR/Nitro route handler, while `image`, `script`, `style`, `font`, `audio` and
 * `video` go through Vite's static-asset pipeline and 404 because there is no matching file on disk.
 * That breaks our `<img src="/api/region-uploads/:id/:filename">` header-logo previews (an `<img>`
 * sends `Sec-Fetch-Dest: image`). Production (Nitro) has no such middleware, so this is a dev-only
 * problem. Stripping the header for `/api/` requests lets Vite pass them through to the real handlers.
 *
 * Kept in sync with trassenscout's `vite/forwardApiRequestsPastViteAssetMiddleware.ts`.
 */
export function forwardApiRequestsPastViteAssetMiddleware(): Plugin {
  return {
    name: 'forward-api-requests-past-vite-asset-middleware',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api/') && req.headers['sec-fetch-dest']) {
          delete req.headers['sec-fetch-dest']
        }
        next()
      })
    },
  }
}
