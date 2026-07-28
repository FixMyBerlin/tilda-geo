# Troubleshooting

## Two-phase upload

1. **Bytes to S3** — Better Upload (`useUploadFiles` → presigned PUT)
2. **App record** — `createServerFn` in `onUploadComplete`

Never skip phase 2 when the app tracks uploads in Postgres. Never create DB records **before** S3 upload completes.

## Anti-patterns

- `uploadFiles()` + TanStack Query **instead of** `useUploadFiles` when you need built-in progress UI
- S3 keys or auth enforced only on the client
- Swallowing `createUploadRecord` errors (orphan S3 objects)
- Importing `*.server.ts` from route files without handler-only usage (see `tanstack-start-conventions`)
- `putObject` helper for **browser** uploads — use router + presigned URLs (`putObject` is fine for small **server-side** buffer puts)
- Importing `@aws-sdk/client-s3` or `PutObjectCommand` when `@better-upload/server/helpers` covers the operation — see [s3-helpers.md](s3-helpers.md)
- `fetch` to S3 from dropzone — use `upload()` only
- `noClick: false` on dropzone when using label + hidden input (double file dialog)

## Error handling

| Event                                   | Use for                                                       |
| --------------------------------------- | ------------------------------------------------------------- |
| `onError`                               | Pre-S3 failures (network, too many files, auth) — show banner |
| `onUploadFail`                          | Some files failed after S3 attempt — optional global handler  |
| Per-file `progress.error`               | Individual file failures in progress list                     |
| `onBeforeUpload` throw / `RejectUpload` | Server-side rejection with message to client                  |

**Prefer `RejectUpload('message')`** for rejections (Trassenscout's `onBeforeUpload` paths use it): `handleRequest` catches it and returns `{ error: { type: 'rejected', message } }` with **400** — the envelope `@better-upload/client` reads. A plain `Error` is rethrown out of `handleRequest`; it only surfaces a message if you wrap the call in a try/catch that returns a `Response` with that **same** `{ error: { message } }` envelope. A bare `{ error: 'string' }` body isn't parsed, so the client shows a generic fallback ([server-router.md](server-router.md)).

Client `onError` example:

```tsx
onError: (error) => {
  const msg = error instanceof Error ? error.message : String(error)
  setUploadError(translateServerError(msg))
}
```

## Route / API mismatch

| Symptom                                    | Check                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 404 on POST                                | Client `api` matches TanStack route path                                                   |
| Unknown route                              | Client `route` string matches `routes: { upload: ... }` key                                |
| CORS on PUT                                | S3 bucket CORS, not app CORS                                                               |
| Auth 401/403                               | Handler runs before `handleRequest`; cookies on same-origin POST                           |
| Dev 404 on `<img src="/api/...">`; prod OK | Add `forwardApiRequestsPastViteAssetMiddleware` — [serving-uploads.md](serving-uploads.md) |

## Metadata

Client `upload(files, { metadata })` is a hint only. Validate with Zod in server `onBeforeUpload` — see [server-router.md](server-router.md).

## accept / fileTypes

Client `accept` on `<input>` mirrors server `fileTypes` for UX. Server validates in `onBeforeUpload`; keep both in sync.

## Multipart

`multipart: true` on route for files **> 5GB** (optional below 5GB). Empty (0-byte) files fail with multipart enabled. Client unchanged — [server-router.md](server-router.md).
