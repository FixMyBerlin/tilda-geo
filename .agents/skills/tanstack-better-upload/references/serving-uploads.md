# Serving uploaded objects

Better Upload handles **upload** (POST → presigned PUT). Serving bytes back to the browser is a separate GET API route. See [s3-helpers.md](s3-helpers.md) for helper APIs.

## When to proxy through the app

| Pattern                                                               | Use when                                                                               |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **GET API route** (`ssr: false`) + `getObject` or shared `proxyS3Url` | Private bucket; per-request auth; inline `<img src>`, `<video src>`, or `<a download>` |
| **`presignGetObject`**                                                | Time-limited direct S3 URL; no per-load auth gate (e.g. email link, export)            |

For inline previews of private uploads, prefer the GET proxy — `presignGetObject` bypasses your auth handler on every image load.

## FMC route shapes

**Trassenscout** — authenticated project uploads, used by `uploadUrl()` for `<img>` previews and downloads:

- `GET /api/:projectSlug/uploads/:id` — canonical (filename-less)
- Auth enforced in `serveProjectUploadObject` inside the handler

**tilda-geo-regions** — region header logos:

- `GET /api/region-uploads/:id/:filename` — `$filename` is cosmetic; auth is public when the upload is an active logo on a public region, otherwise admin-only

Both stream from S3 via a shared `proxyS3Url` helper or `getObject` + `Response`.

## GET handler sketch

```ts
export const Route = createFileRoute('/api/$projectSlug/uploads/$uploadId/')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        endpointAuth.inherited('auth enforced in serveProjectUploadObject')
        return serveProjectUploadObject(request.headers, {
          projectSlug: params.projectSlug,
          uploadId: params.uploadId,
        })
      },
    },
  },
})
```

Handler-only API routes: **`ssr: false`**, no `validateSearch`. Auth inside the handler or delegated server module — see `tanstack-start-conventions`.

## Dev-only: Vite `Sec-Fetch-Dest` routing

In **Vite dev**, requests are routed by `Sec-Fetch-Dest`. Subresource destinations (`image`, `script`, `style`, `font`, `audio`, `video`) go through Vite's static-asset pipeline instead of TanStack Start / Nitro handlers. There is no file on disk at `/api/region-uploads/42/logo`, so dev returns **404** even though production works.

**Symptom:** `<img src="/api/...">` preview 404s locally; POST upload works; production serve works. `fetch('/api/...')` from JS may still work (different `Sec-Fetch-Dest`).

**Fix:** Add a small Vite plugin that strips `sec-fetch-dest` for `/api/` requests. Production (Nitro) is unaffected.

### Plugin (copy per app)

Keep in sync across FMC apps (e.g. tilda-geo-regions, trassenscout):

```ts
// vite/forwardApiRequestsPastViteAssetMiddleware.ts
import type { Plugin } from 'vite'

/**
 * Vite's dev server routes requests by `Sec-Fetch-Dest`: only document-like destinations are
 * forwarded to the SSR/Nitro route handler, while `image`, `script`, `style`, `font`, `audio` and
 * `video` go through Vite's static-asset pipeline and 404 because there is no matching file on disk.
 * That breaks our `<img src="/api/...">` upload previews (an `<img>` sends `Sec-Fetch-Dest: image`).
 * Production (Nitro) has no such middleware, so this is a dev-only problem. Stripping the header
 * for `/api/` requests lets Vite pass them through to the real handlers.
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
```

### `vite.config.ts`

Register **early** in `plugins` (before Vite's asset middleware). `enforce: 'pre'` on the plugin is required.

```ts
import { forwardApiRequestsPastViteAssetMiddleware } from './vite/forwardApiRequestsPastViteAssetMiddleware'

export default defineConfig({
  plugins: [
    // Dev-only: let `<img src="/api/...">` reach route handlers instead of Vite's static pipeline.
    forwardApiRequestsPastViteAssetMiddleware(),
    // ... tanstackStart, nitro, etc.
  ],
})
```

**Not needed when:** uploads are served only via presigned S3 URLs or blob URLs — no `/api/` subresource loads in dev.

## Related

- [s3-helpers.md](s3-helpers.md) — `getObject`, `presignGetObject`
- [troubleshooting.md](troubleshooting.md) — dev 404 symptom row
- [first-time-setup.md](first-time-setup.md) — serving checklist
