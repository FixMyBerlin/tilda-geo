# Uploads

Two separate upload systems share the same S3 bucket and credentials.

**See also:** [Static Datasets Scripts](/app/scripts/StaticDatasets/README.md) for how static datasets are created and uploaded.

| Concept     | Static datasets (`MapDatasetUpload`)                        | Region uploads (`RegionUpload`)                                  |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Purpose     | PMTiles / GeoJSON map datasets                              | Region files (header logo, welcome hero)                         |
| Model       | M2M to regions; `configs` JSON + synced `layerConfigs` rows | Per-region library; role = which `Region` FK points at it        |
| S3 path     | `uploads/{ENV}/…`                                           | `region-uploads/{ENV}/{regionSlug}/{uuid}/{filename}`            |
| Path source | StaticDatasets script (`S3_UPLOAD_FOLDER_BY_APP_ENV`)       | `regionUploadsS3.server.ts` (same `{ENV}` from `VITE_APP_ENV`)   |
| Created by  | Script (`createdBy: SCRIPT`; `USER` exists but unused)      | Admin UI (better-upload) or Bearer/MCP (`region_uploads_create`) |
| Serving     | `/api/uploads/{slug}.{pmtiles\|geojson\|csv}`               | `/api/region-uploads/$id/$filename`                              |

`{ENV}` is `localdev` / `staging` / `production` from `VITE_APP_ENV` (code constant, not a free-floating env knob).

## Static datasets (`MapDatasetUpload`)

### File-level metadata vs. layer config

One row = one **dataset file**. File-level fields live on the upload columns and at the `meta.ts` root: `attributionHtml`, `dataSourceMarkdown`, `dataUpdatedNote`, `licence`, `licenceOsmCompatible`.

Per-layer “Ansichten” come from `meta.ts` `configs[]` (field `categoryKey`). On create, that array is stored as `configs` JSON (wire format for the map) and synced into `MapDatasetLayerConfig` rows (admin UI + CSV export).

### Data source: `local` or `external`

Configured in `meta.ts`:

- **`local`** — GeoJSON → tippecanoe → PMTiles; files uploaded to S3; DB row points at those URLs.
- **`external`** — DB row points at `externalSourceUrl` with `cacheTtlSeconds`; API caches the remote file on the server.

### API

- `GET /api/uploads/{slug}.pmtiles` / `.geojson` / `.csv` (semicolon CSV with `geometry_type`, `geometry_wkt`, plus feature properties)
- `GET /api/uploads/{slug}` — deprecated; falls back to PMTiles

Proxies: `proxyS3Url.server.ts` (S3) and `proxyExternalUrl.ts` (external + file cache).

### Auth

Set in `meta.ts` (`public`, `externalTokenAccess`), stored on `MapDatasetUpload` (`public`, `externalTokenAccess`).

| `meta.ts`                                                    | Who gets the file                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public: true`                                               | Anyone. A token or cookie sent along is ignored                                                                                                                    |
| `public: false` (default for `externalTokenAccess`: `false`) | Admin, or member of a related region, with the TILDA **cookie**. A Bearer token is refused                                                                         |
| `public: false`, `externalTokenAccess: true`                 | Same, and also with `Authorization: Bearer <TILDA token with scope uploads>` (a browser app on another origin, see [External-API-Token.md](External-API-Token.md)) |

Set `externalTokenAccess: true` only for a dataset that a known browser app has to load on its own. Without the flag a third-party app that holds a user's OSM token could exchange it for a TILDA token and read every private upload of that user. A member can only reach the regions of the upload; a membership of a DEACTIVATED region does not count (only admins read files of deactivated regions). An upload without regions is read by admins only.

**Which sign-in:** a request with an `Authorization: Bearer` header uses the token only (never the cookie); any other request (no header, `Basic …`) uses the cookie.

**Answers of a non-public file** (the checks run before the format is looked at, so a guest cannot tell which formats a private file has; a missing slug is `404`, an existing private file answers `401` / `403` for every format; that a private slug exists is therefore visible, accepted because slugs are not secrets):

| Status | Body                                                                  | When                                                                                                  |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 401    | `{ statusText, message }`                                             | Cookie path: not signed in                                                                            |
| 403    | `{ statusText, message }`                                             | Cookie path: signed in, but not admin or member                                                       |
| 401    | `{ error: missing_token \| invalid_token \| token_expired, message }` | Bearer path: no, unknown, wrong-scope (e.g. `notes`) or expired token. Has `WWW-Authenticate: Bearer` |
| 403    | `{ error: not_member, message }`                                      | Bearer path: the token's user is not admin or member                                                  |
| 403    | `{ error: token_access_disabled, message }`                           | Bearer path: member, but the upload has no `externalTokenAccess`                                      |
| 429    | `{ error: rate_limited, message }`                                    | Bearer path: too many failed attempts from this IP; has `Retry-After`                                 |

401 / 403 / 429 are `Cache-Control: no-store` and carry the CORS headers. The errors of the file route itself (`404` unknown slug, `400` format not available, `500` missing file URL) keep `{ statusText, message }` on both paths. The `error` formats of the Bearer path are the external API errors, see [External-API-Token.md](External-API-Token.md#errors).

**Caching:** every answer of a non-public upload (cookie or token; file, `304`, `206`, CSV and external sources) is `Cache-Control: private, no-cache` with `Vary: Authorization, Cookie`: no shared cache keeps it, and the browser revalidates with `If-None-Match` (cheap `304` after the access check). Public uploads keep `public, max-age=3600, must-revalidate` (S3) or the TTL of the external source. Code: `withPrivateCaching` in `app/src/server/api/util/cacheHeaders.server.ts`.

**CORS:** `Access-Control-Allow-Origin: *` and `Access-Control-Expose-Headers: ETag, Content-Range, Content-Length, Content-Disposition` on every answer, errors included. The preflight (`OPTIONS`) allows `GET, OPTIONS` and `Authorization, Content-Type, Accept, Accept-Encoding, Range, If-None-Match`.

Example (browser app, `externalTokenAccess: true`):

```js
const { token } = await fetch(`${origin}/api/auth/osm-token?scope=uploads`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${osmAccessToken}` },
}).then((response) => response.json())

const geojson = await fetch(`${origin}/api/uploads/bewertung-rvn-app.geojson`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((response) => response.json())
```

## Region uploads (logos, welcome images)

Admin UI: upload on the region edit form → `POST /api/admin/region-uploads/upload` (session + better-upload) → `RegionUpload` row; form stores its id in `Region.headerLogoId` / welcome image fields.

Bearer / MCP: `POST /api/admin/region-uploads` (or MCP `region_uploads_create`) with base64 bytes → same library row; then attach via `PUT /api/admin/regions/$slug` (`headerLogoId` or `welcome.image.uploadId`). Here `mimeType` is caller-supplied (not derived from a real file like in the browser), so the bytes are checked against the declared type and scripted SVGs are rejected — see `regionUploadSniff.ts`.

Serve URL is `/api/region-uploads/{id}/{filename}` (filename cosmetic). Public only when that upload is the active logo or welcome image of a **PUBLIC** region; otherwise admin-only (preview before save). Unreferenced uploads are GC’d via `deleteRegionUploadIfUnreferenced` (S3 + DB) when no region FK still points at them.
