# Better Upload — server router

## Router shape

```ts
import { route, type Router } from '@better-upload/server'
import { aws } from '@better-upload/server/clients'

export function createUploadRouter(options: CreateUploadRouterOptions) {
  return {
    client: aws({ accessKeyId, secretAccessKey, region }),
    bucketName: S3_BUCKET,
    routes: {
      upload: route({
        multipleFiles: true,
        maxFileSize: S3_MAX_FILE_SIZE_BYTES,
        maxFiles: S3_MAX_FILES,
        onBeforeUpload: async ({ req, files, clientMetadata }) => {
          // auth, validation, key generation
          return {
            generateObjectInfo: ({ file }) => ({
              key: `${rootFolder}/${keyPrefix}/${crypto.randomUUID()}/${sanitize(file.name)}`,
              metadata: { userId: String(userId), source: 'uploadDropzone' },
            }),
          }
        },
      }),
    },
  } satisfies Router
}
```

## Route options (multiple files)

| Option                | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `multipleFiles: true` | Batch upload                                                 |
| `maxFiles`            | Server-enforced count                                        |
| `maxFileSize`         | Bytes per file                                               |
| `fileTypes`           | MIME allowlist, e.g. `['image/*', 'application/pdf']`        |
| `multipart: true`     | Required for files **> 5GB**; optional speed boost below 5GB |
| `partSize`            | Multipart chunk size (default 50MB)                          |

Prefer `fileTypes` on the route **and** explicit validation in `onBeforeUpload` when rules are complex (e.g. Office MIME list).

## onBeforeUpload

Runs **before** presigned URLs are generated. Receives `req`, `files`, `clientMetadata` (from client `upload(..., { metadata })`).

Return value can include:

- `generateObjectInfo({ file })` → `{ key, metadata? }` per file
- `bucketName` override per request

Reject uploads by throwing from `onBeforeUpload`. **Prefer `RejectUpload`:**

```ts
import { RejectUpload } from '@better-upload/server'

if (!user) throw new RejectUpload('Not logged in')
```

**Why `RejectUpload` over a plain `Error`:** `handleRequest` catches `RejectUpload` internally and returns **HTTP 400** with body `{ error: { type: 'rejected', message } }` — exactly the envelope `@better-upload/client` parses (`onError` reads `error.message`). A plain `Error` is **rethrown out of `handleRequest`** (there is no outer try/catch); left alone it surfaces as a 500 with no client-parseable message.

In Trassenscout the `onBeforeUpload` paths throw `RejectUpload`, so `handleRequest` shapes the 400 envelope itself; the `uploadErrorResponse` wrapper is only a catch-all that maps unexpected/auth errors to a fallback `Response`. If you instead rely on a plain `Error`, that wrapper must emit the same `{ error: { message } }` envelope the client reads — a bare `{ error: 'string' }` body is **not** parsed (`error.message` is `undefined`), so the message is dropped to a generic fallback.

## onAfterSignedUrl

Runs after URLs are generated; `files` include `objectInfo`. Use for logging or side effects that do not need to block the client.

## Client metadata flow

```tsx
// Client
upload(files, { metadata: { surveyResponseId: 1, surveySessionId: 2 } })
```

```ts
// Server onBeforeUpload
const params = SurveyUploadParamsSchema.safeParse({
  surveyResponseId: clientMetadata?.surveyResponseId,
  surveySessionId: clientMetadata?.surveySessionId,
})
if (!params.success) throw new Error('Missing or invalid survey session')
```

Validate metadata with Zod in `onBeforeUpload`, not on the client alone.

## Key naming

- Sanitize filenames (`sanitizeKey`) — avoid path traversal
- Include tenant scope (`projectSlug`, user id folder)
- Use UUID segment to prevent collisions
- Store `source: "uploadDropzone"` (or enum) in object metadata for debugging

## handleRequest

Single entry for all Better Upload protocol steps (sign, complete multipart, etc.):

```ts
return handleRequest(request, router)
```

Do not reimplement presign logic manually unless using low-level TanStack Query `uploadFiles()` API.

## Shared router factory

Extract `createUploadRouter({ keyPrefix, userId, onBeforeUpload })` when multiple endpoints share S3 config but differ in auth prefix or validation.

## Multiple upload endpoints

| Endpoint                        | Auth                                         | Metadata                                                  |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `/api/$projectSlug/upload`      | Project member                               | `userId` in S3 object metadata                            |
| `/api/survey-upload`            | Public + session binding in `onBeforeUpload` | `surveyResponseId`, `surveySessionId` via client metadata |
| `/api/support/documents/upload` | Admin                                        | `keyPrefix: "support"`                                    |

Client must set matching `api` and pass metadata:

```tsx
useUploadFiles({ route: 'upload', api: '/api/survey-upload' })
upload(files, { metadata: { surveyResponseId, surveySessionId } })
```

## Non-upload S3 operations

For reads/deletes outside the upload flow, use `@better-upload/server/helpers` with `getConfiguredS3Client()` — see [s3-helpers.md](s3-helpers.md). Do not use `putObject` for browser uploads; do not reach for raw `@aws-sdk/client-s3` when a helper exists.
