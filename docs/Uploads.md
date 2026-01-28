# Uploads System / Static Dataset System

The uploads system provides access to static datasets (PMTiles and GeoJSON) with authentication, caching, and multiple data source types.

**See also:** [Static Datasets Scripts](/app/scripts/StaticDatasets/README.md) for how datasets are created and uploaded.

## Uploads can be created by `script` or `user`

All uploads from `/app/scripts/StaticDatasets` are of `createdBy: SCRIPT`.
The system allows to create uploads `createdBy: USER` that are managed manually. This is not in use ATM.

## Uploads can have source the data `local` or `external`

The system supports two data source types, configured in `meta.ts` when creating datasets:

1. **Local Sources** (`dataSourceType: 'local'`)
   * Uploads-DB Entry: Created manually via `npm run StaticDatasets:*`
   * Files: Stored on S3 at the same time.
2. **External Sources** (`dataSourceType: 'external'`)
   * Uploads-DB Entry: Created manually via `npm run StaticDatasets:*`
   * Files: Downloaded and cached on the server with TTL to auto-update the files regularly

## API Endpoints

- `GET /api/uploads/{slug}.pmtiles` - Returns PMTiles file
- `GET /api/uploads/{slug}.geojson` - Returns GeoJSON file
- `GET /api/uploads/{slug}.csv` - CSV export of GeoJSON data with semicolon delimiter
- `GET /api/uploads/{slug}` - _deprecated_ Returns PMTiles (fallback for old URLs)

### CSV Format

- `geometry_type`: Geometry type (Point, LineString, Polygon, etc.)
- `geometry_wkt`: WKT representation (QGIS compatible)
- All GeoJSON feature properties as additional columns

## Data Source Types

### Internal Sources `dataSourceType: 'local'`

**Creation (via StaticDatasets npm-script):**

When using `dataSourceType: 'local'` in `meta.ts`:

1. Read the input GeoJSON (uncompress if needed) and run the folders `transform.ts` if present
2. Run `tippecanoe` and create the PMTiles file
3. Upload the transformed GeoJSON and PMTiles files to S3
4. Delete and create the database relation to connect these files to the region(s)

**Serving:**

Handled by: [`proxyS3Url`](/app/src/app/api/uploads/[slug]/utils/proxyS3Url.ts)

Files are proxied through the API.

- HTTP Range request support for PMTiles (partial file downloads)
- Optional compression for GeoJSON (gzip/br) based on Accept-Encoding header
- Download headers for GeoJSON files

**Caching Strategy:**
- Uses S3 ETags and Last-Modified for cache validation
- 1 hour cache with must-revalidate (browser checks after 1 hour)
- PMTiles range requests are typically not cached by browsers
- S3 handles conditional requests (If-None-Match/304 responses)

### External Sources `dataSourceType: 'external'`

**Creation (via StaticDatasets npm-script):**

When using `dataSourceType: 'external'` in `meta.ts`:

1. Create database entry pointing to the external URL (`externalSourceUrl`)
2. Configure cache TTL (`cacheTtlSeconds`)

**Serving:**

Handled by: [`proxyExternalUrl`](/app/src/app/api/uploads/[slug]/utils/proxyExternalUrl.ts)

Files are proxied from external URLs with file-based caching and configurable TTL.

**Caching Strategy:**
- Uses file-based cache in `public/temp/uploads-cache/`
- Cache validity checked via TTL (time-to-live) per upload
- Preserves Last-Modified header from external source
- Handles .gz decompression for compressed GeoJSON
- Returns debugging headers (`X-Data-Last-Fetched`, `X-Source-Last-Modified`)

**Three Response Branches:**

1. **PMTiles range request** - Handles HTTP Range requests for partial PMTiles data
   - Returns `206 Partial Content` with `Content-Range` header
   - Supports byte-range requests for efficient tile loading

2. **GeoJSON full download** - Handles full GeoJSON download with optional compression (gzip/br)
   - Compresses response if client supports it via Accept-Encoding header
   - Handles `.gz` decompression for compressed source files

3. **PMTiles full file** - Handles full PMTiles download when no range request
   - Returns complete file with standard caching headers

**Cache Management:**
- Cache metadata stored in `{slug}-{format}.meta.json` files
- Cached files stored as `{slug}-{timestamp}.{format}`
- Old cache files automatically cleaned up when new versions are fetched
- Respects `ETag` and `Last-Modified` headers for conditional requests (304 Not Modified)

## Authentication

- **Public uploads** (`public: true`): Accessible to all users
- **Private uploads** (`public: false`): Require authentication
  - Admin users: Full access
  - Regular users: Must be a member of at least one region the upload is related to
