# Uploads

Two separate upload systems share the same S3 bucket and credentials.

**See also:** [Static Datasets Scripts](/app/scripts/StaticDatasets/README.md) for how static datasets are created and uploaded.

| Concept     | Static datasets (`MapDatasetUpload`)                        | Region uploads (`RegionUpload`)                                |
| ----------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Purpose     | PMTiles / GeoJSON map datasets                              | Region files (currently: header logo)                          |
| Model       | M2M to regions; `configs` JSON + synced `layerConfigs` rows | Per-region library; role = which `Region` FK points at it      |
| S3 path     | `uploads/{ENV}/…`                                           | `region-uploads/{ENV}/{regionSlug}/{uuid}/{filename}`          |
| Path source | StaticDatasets script (`S3_UPLOAD_FOLDER_BY_APP_ENV`)       | `regionUploadsS3.server.ts` (same `{ENV}` from `VITE_APP_ENV`) |
| Created by  | Script (`createdBy: SCRIPT`; `USER` exists but unused)      | Admin via region edit form (better-upload)                     |
| Serving     | `/api/uploads/{slug}.{pmtiles\|geojson\|csv}`               | `/api/region-uploads/$id/$filename`                            |

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

- `public: true` — anyone
- `public: false` — admin, or member of a related region

## Region uploads (logos)

Admin uploads a logo on the region edit form → `POST /api/admin/region-uploads/upload` → `RegionUpload` row; form stores its id in `Region.headerLogoId`.

Serve URL is `/api/region-uploads/{id}/{filename}` (filename cosmetic). Public only when that upload is the active logo of a **PUBLIC** region; otherwise admin-only (preview before save). Unreferenced uploads are GC’d via `deleteRegionUploadIfUnreferenced` (S3 + DB) when no `headerLogoId` still points at them.
