---
name: tanstack-better-upload
description: >-
  Direct-to-S3 uploads in TanStack Start with @better-upload/server and
  @better-upload/client (presigned PUT, API route POST handlers,
  useUploadFiles/useUploadFile, S3 object helpers). Optional react-dropzone
  add-on only for multi-file drag-and-drop UX. Use for upload API routes,
  presigned S3, upload progress, post-upload DB persistence, or the dropzone
  component stack.
---

# Better Upload (TanStack Start)

**@better-upload/server** + **@better-upload/client** — presigned direct-to-S3 uploads via TanStack Start POST handlers and `useUploadFiles` / `useUploadFile`.

**react-dropzone** — optional FMC add-on for drag-and-drop **multi-file** UX. Add it only when the product needs that interaction (`multipleFiles`, batch progress). Single-file button/picker flows use Better Upload hooks alone — no dropzone dependency.

**Upstream (Better Upload):** [llms-full.txt](https://better-upload.com/llms-full.txt) · [quickstart](https://better-upload.com/docs/quickstart-single.mdx)

## When to apply

**Better Upload (always relevant for uploads):**

- New upload endpoint under `routes/api/`
- `useUploadFiles` / `useUploadFile` and upload progress
- S3 object helpers (`getObject`, `deleteObject`, `presignGetObject`, `putObject`) via Better Upload — not raw `@aws-sdk/client-s3`
- Post-upload DB records via `createServerFn` + TanStack Query

**react-dropzone (only when UX needs it):**

- Drag-and-drop multi-file dropzone with batch progress
- FMC `UploadDropzone*` component stack

Single-file pickers, plain `<input>`, and paste areas call `upload()` directly — no react-dropzone. Details: [dropzone-ui.md](references/dropzone-ui.md).

## Architecture (FMC)

```text
Client                          Server API route                 S3
──────                          ────────────────                 ──
file picker / dropzone* onDrop
  → useUploadFiles.upload()  →  handleRequest(router)       →  PUT presigned
  → onUploadComplete         →  onBeforeUpload (auth, keys)
  → create*Fn (server fn)    →  (separate RPC, not Better Upload)
  → invalidate queries

* dropzone = optional react-dropzone layer (multi-file drag-and-drop only)
```

**Two phases:** bytes to S3, then app DB row via server function. See [troubleshooting.md](references/troubleshooting.md).

## References (read as needed)

| Situation                                                         | File                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| **First-time setup** — packages, env, CORS, API route, smoke test | [first-time-setup.md](references/first-time-setup.md) |
| Server `Router`, `route()`, `onBeforeUpload`, metadata            | [server-router.md](references/server-router.md)       |
| `useUploadFiles`, events, DB payload after complete               | [client-hooks.md](references/client-hooks.md)         |
| **Optional** multi-file dropzone UI (react-dropzone)              | [dropzone-ui.md](references/dropzone-ui.md)           |
| `getObject`, `deleteObject`, `presignGetObject`, S3 client policy | [s3-helpers.md](references/s3-helpers.md)             |
| Errors, anti-patterns, debugging                                  | [troubleshooting.md](references/troubleshooting.md)   |

## Related skills

- `tanstack-start-conventions` — `.server.ts` / `.functions.ts`, API route boundaries, SSR
- `tanstack-start-app-structure` — `src/server/uploads/` layout

## Usage rules (daily work)

| Topic           | Rule                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route name      | Client `route: 'upload'` must match `routes: { upload: route({...}) }`                                                                                                  |
| API path        | Client defaults to `/api/upload`; set `api` when the TanStack route differs                                                                                             |
| Handler         | `return handleRequest(request, router)` — no Next.js adapter                                                                                                            |
| Auth            | Enforce in handler or `onBeforeUpload`; `endpointAuth.inherited(...)` when auth lives in handler                                                                        |
| DB after upload | `useMutation({ mutationFn: createUploadFn })` in `onUploadComplete`                                                                                                     |
| Boundaries      | Post-upload persistence in `*.functions.ts` + `createServerFn`; never import `@better-upload/server` in client components                                               |
| S3 access       | `getConfiguredS3Client()` (`aws()`) + `@better-upload/server/helpers` — not `@aws-sdk/client-s3` unless helpers lack the op ([s3-helpers.md](references/s3-helpers.md)) |

For setup steps and checklists, start with [first-time-setup.md](references/first-time-setup.md).
