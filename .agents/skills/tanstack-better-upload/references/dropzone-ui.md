# react-dropzone UI (optional add-on)

**Scope:** FMC drag-and-drop **multi-file** UX on top of Better Upload. Not part of Better Upload itself.

Add **react-dropzone** only when the product needs batch drag-and-drop (`multipleFiles`, progress list). Skip for:

- Single-file `useUploadFile` + button/picker
- Plain `<input type="file">` calling `upload()` without drag-and-drop
- Paste-to-upload wired directly to `upload()` (no react-dropzone)

Better Upload exposes the `UploadHookControl` contract; it does not ship a dropzone. Better Upload's [shadcn UploadDropzone](https://better-upload.com/docs/components/upload-dropzone) is built on react-dropzone — FMC apps use a custom styled variant with the same wiring.

Install react-dropzone in [first-time-setup.md](first-time-setup.md) when this doc applies.

## Core wiring

```tsx
import { useDropzone } from 'react-dropzone'
import type { UploadHookControl } from '@better-upload/client'

function UploadDropzoneProgress({
  control: { upload, isPending, progresses },
  accept,
  metadata,
  uploadOverride,
}: {
  control: UploadHookControl<true>
  accept?: string
  metadata?: Record<string, unknown>
  uploadOverride?: (...args: Parameters<UploadHookControl<true>['upload']>) => void
}) {
  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    onDrop: async (files) => {
      if (files.length > 0) {
        if (uploadOverride) {
          uploadOverride(files, { metadata })
        } else {
          upload(files, { metadata })
        }
      }
      if (inputRef.current) inputRef.current.value = ''
    },
    noClick: true,
  })

  const inputProps = getInputProps()

  return (
    <label {...getRootProps()} htmlFor={id}>
      <input {...inputProps} type="file" multiple accept={accept} disabled={isPending} />
      {/* drag overlay when isDragActive */}
      {/* progress list from progresses */}
    </label>
  )
}
```

## Why `noClick: true`

- Dropzone root handles **drag-and-drop** only
- Visible `<label htmlFor={inputId}>` + `<input type="file">` handles **click-to-select**
- Prevents double-open file dialog

## Input reset

Always clear after drop/select so the same file can be re-selected:

```ts
inputRef.current.value = ''
```

## accept attribute

```tsx
accept={getAcceptAttribute()} // e.g. "image/*,.pdf,..."
```

Client hint only — server validates. See [troubleshooting.md](troubleshooting.md).

## Progress UI

Render `progresses` from `UploadHookControl`:

```tsx
progresses.map((progress) => <FileUploadItem key={progress.objectInfo.key} progress={progress} />)
```

Per-file states: uploading (`progress < 1`), `complete`, `failed` (check `progress.error`).

Use `formatBytes` from `@better-upload/client/helpers`.

## Extended UX (FMC patterns)

Optional enhancements on top of the shadcn template:

- **beforeunload** when `isPending` — warn on tab close mid-upload
- **Modal close guard** during upload
- **Auto-hide** completed rows after animation
- **Manual dismiss** for failed rows
- **Spinner overlay** when `isPending && progresses.length === 0` (awaiting first progress event)
- **Translated errors** via shared `translateServerError` for server messages

## Component stack

```text
UploadDropzone (domain: API path, createUploadRecord, relations)
  └─ UploadDropzoneBase (useUploadFiles, onUploadComplete → DB)
       └─ UploadDropzoneProgress (react-dropzone + progress list)
            └─ wrapped by UploadDropzoneContainer (layout)
```

Domain wrappers: `SurveyUploadDropzone`, `SupportUploadDropzone` — same base, different `api` + server fn.

## shadcn vs custom

| Approach                                        | When                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `npx shadcn add @better-upload/upload-dropzone` | Greenfield, shadcn/Tailwind v4 tokens                      |
| Custom `UploadDropzoneProgress`                 | Existing design system (Heroicons, FMC forms, German copy) |

Either way: pass `control` from `useUploadFiles`, do not call S3 from dropzone directly.

## Paste uploads

A paste handler can feed the same `control.upload`: `onPasteCapture` → collect `clipboardData` files → `upload(files, { metadata })`. No react-dropzone needed — same contract as the dropzone.

Dropzone anti-patterns: [troubleshooting.md](troubleshooting.md).
