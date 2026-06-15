# Better Upload — S3 client & helpers

## Default rule

**Do not** use `@aws-sdk/client-s3` or `S3Client` for routine S3 work. Use Better Upload end-to-end:

| Layer             | Package                                             | Use for                                                         |
| ----------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| Client factory    | `@better-upload/server/clients` (`aws()`, etc.)     | Single configured instance for router + helpers                 |
| Browser uploads   | `@better-upload/server` (`Router`, `handleRequest`) | Presigned client PUT — not helpers, not raw SDK                 |
| Server object ops | `@better-upload/server/helpers`                     | `getObject`, `deleteObject`, `presignGetObject`, `putObject`, … |

FMC pattern: one `getConfiguredS3Client()` in `s3Client.server.ts` — return `aws({ ... })` — shared by the upload router and all helper calls.

Do **not** add `@aws-sdk/client-s3` unless you have confirmed a helper gap (see [When raw AWS SDK is justified](#when-raw-aws-sdk-is-justified)).

## Client factory

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

Also available: `cloudflare`, `backblaze`, `minio`, `custom`, etc. See [helpers-server](https://better-upload.com/docs/helpers-server.mdx).

## Router vs helpers

| Use case                                                       | API                                             |
| -------------------------------------------------------------- | ----------------------------------------------- |
| Browser / dropzone uploads                                     | `Router` + `handleRequest` + presigned URLs     |
| Server-side buffer/file put (email attachment, sync overwrite) | `putObject` helper + `getConfiguredS3Client()`  |
| Download / stream                                              | `getObject`, `getObjectBlob`, `getObjectStream` |
| Delete on record removal                                       | `deleteObject`, `deleteObjects`                 |
| Signed download link                                           | `presignGetObject`                              |
| Metadata only                                                  | `headObject`                                    |

**Direction:** browser-scale uploads → router; server-side small puts → `putObject` helper; never `PutObjectCommand` from `@aws-sdk/client-s3` when the helper suffices.

## Common helpers

```ts
import { getObject, deleteObject, presignGetObject, putObject } from '@better-upload/server/helpers'

const s3 = getConfiguredS3Client()

const object = await getObject(s3, { bucket: S3_BUCKET, key })

await deleteObject(s3, { bucket: S3_BUCKET, key })

const url = await presignGetObject(s3, {
  bucket: S3_BUCKET,
  key,
  expiresIn: 3600,
})

await putObject(s3, {
  bucket: S3_BUCKET,
  key,
  body: buffer,
  contentType: 'application/pdf',
  metadata: { source: 'emailAttachment' },
})
```

## Trassenscout audit (reference app)

**Better Upload path (the norm):**

- Upload router / `handleRequest` → `getConfiguredS3Client()`
- Serve, fetch PDF, delete → `getObject` / `deleteObject` + `getConfiguredS3Client()`

**Raw `@aws-sdk/client-s3` today (should migrate to helpers):**

- `uploadEmailAttachment.server.ts` — `PutObjectCommand` + `getAwsSdkS3Client()` → prefer `putObject()`
- `luckycloud.server.ts` `endCollaboration` — same overwrite pattern → prefer `putObject()`

**Not used in Trassenscout despite comments:** Range/partial reads via `GetObjectCommand` (the documented reason for a separate `getAwsSdkS3Client()`).

**Not direct client usage:** `S3ServiceException` in `summarizeUpload.server.ts` — error typing only.

## When raw AWS SDK is justified

Add `@aws-sdk/client-s3` and a separate `getAwsSdkS3Client()` only when Better Upload helpers lack the operation (e.g. Range header on GetObject, command options helpers do not expose). Document the reason next to the factory. Try `putObject` / `getObject` / other helpers first.

## Object keys and URLs

- Keys come from `generateObjectInfo` in `onBeforeUpload` (browser uploads) or shared key helpers (server puts)
- Store key or full URL in DB via `getS3Url(key)`
- Do not expose bucket credentials to the client

## Multipart

Enable on **route** for very large browser uploads:

```ts
route({ multipleFiles: true, multipart: true, partSize: 20 * 1024 * 1024 })
```

Client unchanged. Empty (0-byte) files fail with multipart enabled — [troubleshooting.md](troubleshooting.md).

Package version pin: [first-time-setup.md](first-time-setup.md).
