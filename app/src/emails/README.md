# Emails (React Email)

## Development

- Run **`bun run mailpreview`** from `app/` — starts the [React Email CLI](https://react.email/docs/cli) (`email dev --dir src/emails`) so templates with a `export default` appear in the sidebar. The devDependency **`@react-email/ui`** is required for the preview UI ([manual setup](https://react.email/docs/getting-started/manual-setup)).
- **`VITE_APP_ORIGIN`** is set in the script so [`_utils/getDomain.ts`](./_utils/getDomain.ts) matches the local Vite app when resolving image URLs (e.g. logo in [`_templates/MarkdownMail.tsx`](./_templates/MarkdownMail.tsx)).

## Layout

- **`_templates/`** — shared React Email components (underscore prefix: ignored by the preview scanner per [CLI docs](https://react.email/docs/cli)).
- **`_utils/`** — `render`, Mailjet wiring, types (`sendMail`, etc.).
- **`*Mailer.tsx`** at this level — mailer actions plus optional `export default` for preview.

For preview-only static assets, React Email supports **`static/`** under this directory (served at `/static/...` on the preview host). Production sends still need absolute URLs; we use the app origin and `public/emails/` assets instead.

## Sending

[`_utils/sendMail.tsx`](./_utils/sendMail.tsx) uses [`render`](https://react.email/docs/utilities/render) from `react-email`. In dev/test, [`preview-email`](https://www.npmjs.com/package/preview-email) opens a browser when mail is sent through the app (separate from `mailpreview`).
