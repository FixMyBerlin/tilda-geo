# First-time setup

One-time **Better Upload** wiring before domain-specific upload UIs. For ongoing patterns, see [server-router.md](server-router.md) and [client-hooks.md](client-hooks.md). Add [dropzone-ui.md](dropzone-ui.md) only when building multi-file drag-and-drop UX.

## Checklist

```
Task progress (Better Upload — required):
- [ ] Install @better-upload/server + @better-upload/client (same version)
- [ ] Env vars + shared upload constants (bucket, region, limits)
- [ ] S3 bucket CORS for browser PUT
- [ ] createUploadRouter() in *.server.ts
- [ ] TanStack API route: POST → handleRequest, ssr: false
- [ ] Auth + validation in handler or onBeforeUpload
- [ ] Client useUploadFiles({ route, api }) — names/paths match server
- [ ] Smoke test: POST to app API, then PUT to S3, then DB row

Task progress (serving — when previews/downloads use GET /api/ routes):
- [ ] GET serve route (ssr: false) + auth in handler
- [ ] forwardApiRequestsPastViteAssetMiddleware in vite.config.ts (if previews use `<img src="/api/...">`)

Task progress (react-dropzone — only if multi-file dropzone UX):
- [ ] bun add react-dropzone
- [ ] Wire useDropzone onDrop → upload() — see dropzone-ui.md
```

## Packages

**Better Upload (required for any upload flow):**

```bash
bun add @better-upload/server @better-upload/client
```

Pin `@better-upload/server` and `@better-upload/client` to the **same version**.

**react-dropzone (optional — multi-file drag-and-drop only):**

```bash
bun add react-dropzone
```

Do not install react-dropzone for single-file `useUploadFile` flows or a plain `<input type="file">` that calls `upload()`.

## Environment & constants

```env
S3_UPLOAD_KEY=
S3_UPLOAD_SECRET=
S3_UPLOAD_ROOTFOLDER=production   # prefix segment in object keys
```

Shared constants (e.g. `shared/uploads/config.ts`):

```ts
export const S3_BUCKET = 'my-bucket'
export const S3_REGION = 'eu-central-1'
export const S3_MAX_FILE_SIZE_BYTES = 1024 * 1024 * 50
export const S3_MAX_FILES = 10
```

Mirror `maxFileSize` and `maxFiles` in server `route()` from the same constants.

## S3 CORS (required)

Bucket must allow browser PUT to presigned URLs:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## S3 client factory

```ts
import { aws } from '@better-upload/server/clients'

export function getConfiguredS3Client() {
  return aws({
    accessKeyId: process.env.S3_UPLOAD_KEY,
    secretAccessKey: process.env.S3_UPLOAD_SECRET,
    region: S3_REGION,
  })
}
```

Use the same `getConfiguredS3Client()` (`aws()`) for the upload router and all helper calls. Do not add `@aws-sdk/client-s3` unless a helper gap is confirmed — [s3-helpers.md](s3-helpers.md).

## API route (POST handler)

Minimal (official Better Upload snippet):

```ts
import { createFileRoute } from '@tanstack/react-router'
import { handleRequest, route, type Router } from '@better-upload/server'
import { aws } from '@better-upload/server/clients'

const router: Router = {
  client: aws(),
  bucketName: 'my-bucket',
  routes: {
    images: route({ fileTypes: ['image/*'], multipleFiles: true, maxFiles: 4 }),
  },
}

export const Route = createFileRoute('/api/upload')({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => handleRequest(request, router),
    },
  },
})
```

FMC pattern — thin route, auth in handler module:

```ts
// routes/api/$projectSlug/upload/index.ts
import { createFileRoute } from '@tanstack/react-router'
import { handleProjectUploadRoute } from '@/server/uploads/upload-route-handlers.server'
import { endpointAuth } from '@/server/auth/endpointAuth.server'

export const Route = createFileRoute('/api/$projectSlug/upload/')({
  ssr: false,
  server: {
    handlers: {
      POST: ({ request, params }) => {
        endpointAuth.inherited('auth enforced in handleProjectUploadRoute')
        return handleProjectUploadRoute(request, params.projectSlug)
      },
    },
  },
})
```

## Handler module

Keep `handleRequest` wiring in `*.server.ts`:

```ts
import { handleRequest } from '@better-upload/server'
import { createUploadRouter } from './_utils/createUploadRouter'
import { endpointAuth } from '@/server/auth/endpointAuth.server'

export async function handleProjectUploadRoute(request: Request, projectSlug: string) {
  const session = await endpointAuth.projectMember({
    headers: request.headers,
    projectSlug,
    roles: editorRoles,
  })

  try {
    const router = createUploadRouter({
      keyPrefix: projectSlug,
      userId: Number(session.userId),
      onBeforeUpload: async (files) => {
        assertSupportedUploadMimeTypes(files)
      },
    })
    return handleRequest(request, router)
  } catch (error) {
    return uploadErrorResponse(error)
  }
}
```

Router factory shape: [server-router.md](server-router.md).

## TanStack Start conventions

Pair with `tanstack-start-conventions`:

- API routes: **`ssr: false`**, no `validateSearch`
- Do not add `import '@tanstack/react-start/server-only'` to API route files
- Post-upload persistence: **`createServerFn`** in `*.functions.ts`, called from `useMutation` in `onUploadComplete`
- Invalidate upload list queries after batch completes

## Serving uploaded objects

Better Upload only uploads. Serving bytes back uses separate GET API routes — proxy vs presigned URL, FMC examples, and the dev Vite plugin for `<img src="/api/...">` previews: [serving-uploads.md](serving-uploads.md). Helper APIs: [s3-helpers.md](s3-helpers.md).

## Smoke test

Authenticated page with dropzone → upload small file → assert DB row + S3 key. Network tab: POST to upload API, then PUT to S3.
