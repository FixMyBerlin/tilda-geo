# Favicon and app icons

Icons are generated once when the source changes (not in the build). Add the generated files to `app/public/` and keep the head links in sync.

## Generate icons

From the `app/` directory:

```bash
bun scripts/generate-favicons/process.ts
```

The script uses the [favicons](https://www.npmjs.com/package/favicons) package (itgalaxy), reads `public/favicon.svg`, and writes a **subset** of icons plus manifest files to `public/`.

**Shared config** (used by the app and this script) is in [`app/src/meta.const.ts`](../../src/meta.const.ts): `title`, `shortName`, `description`, `themeColor`. Generator-only options (e.g. `display`, `start_url`, which icon sets) are in [`process.ts`](./process.ts).

**Output:** `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `manifest.webmanifest`, and `manifest.json`. The script does not overwrite `favicon.svg` (your source); the manifest includes it so clients that support SVG can use the scalable icon.

**Optional:** Run [ImageOptim](https://imageoptim.com/) (or similar) on the generated PNG/ICO files in `app/public/` to reduce size, then commit.

## Where links are defined

[`app/src/routes/__root.tsx`](../../src/routes/__root.tsx) — in the root route’s `head()`, `links` array.

## Links to use

| Use              | `rel`              | `href`                  | `type`          | Notes                                     |
| ---------------- | ------------------ | ----------------------- | --------------- | ----------------------------------------- |
| Favicon (vector) | `icon`             | `/favicon.svg`          | `image/svg+xml` | Modern browsers prefer this when present. |
| Favicon (raster) | `icon`             | `/favicon-32x32.png`    | `image/png`     | Fallback; add `sizes: '32x32'`.           |
| Favicon (raster) | `icon`             | `/favicon-16x16.png`    | `image/png`     | Small; add `sizes: '16x16'`.              |
| Apple touch      | `apple-touch-icon` | `/apple-touch-icon.png` | —               | iOS home screen; PNG.                     |

Browsers that support SVG use the SVG; others use the PNG. `favicon.ico` is picked up automatically from the root. Apple touch is only used for "Add to Home Screen".

## Manifest vs scaffolding

Generated `app/public/manifest.json` matches the structure of [tilda-tanstack-scaffolding/public/manifest.json](../../../tilda-tanstack-scaffolding/public/manifest.json): same fields; we use `android-chrome-*` filenames and values from `APP_META`. The script also writes `manifest.webmanifest` with the same icon subset and `purpose`/`dir`/`lang` for PWA.
