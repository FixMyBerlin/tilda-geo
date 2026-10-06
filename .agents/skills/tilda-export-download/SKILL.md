---
name: tilda-export-download
description: Download TILDA Geo dataset exports (GeoJSON, GPKG, FGB) from tilda-geo.de by bbox. Use when the user asks to export or download map data, bikelanes, roads, parkings, or other export tables for a bounding box.
---

# TILDA export download

Download clipped exports from production via `/api/export`.

## Before downloading

1. **Bbox** — ask the user for a GeoJSON-style bbox: `[minlon, minlat, maxlon, maxlat]` (WGS84). Pass all four params or none; without them the export covers the whole region (all of Germany — very large).
2. **Dataset** — ask which table (e.g. `bikelanes`, `roads`, `parkings`). Allowed values: `exportApiIdentifier` in [`exportIdentifier.ts`](../../../app/src/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier.ts).
3. **Format(s)** — ask which format(s). Allowed values: [`app/src/server/api/export/ogrFormats.const.ts`](../../../app/src/server/api/export/ogrFormats.const.ts) (`geojson`, `gpkg`, `fgb`; the API defaults to `fgb`).
4. **Output path** — ask where to save files (create the directory if needed).

Always use region slug **`deutschland`**.

## Download

Each deployment has its own API key. Production needs `ATLAS_API_KEY_PRODUCTION` from repo root `.env` — plain `ATLAS_API_KEY` is the local dev key and returns 401 against production. Do **not** `source .env` (some values break the shell):

```bash
API_KEY=$(grep '^ATLAS_API_KEY_PRODUCTION=' .env | cut -d= -f2- | tr -d "\"'")
[ -n "$API_KEY" ] || echo "ATLAS_API_KEY_PRODUCTION missing in .env (Bitwarden: TILDA Secrets)"
```

If the key is missing, stop and ask the user to add it; an empty `apiKey` falls through to the session check and returns 401. Never print the key or the full URL.

URL pattern:

```
https://tilda-geo.de/api/export/deutschland/{table}?minlon={}&minlat={}&maxlon={}&maxlat={}&format={format}&apiKey=${API_KEY}
```

Example (`bikelanes`, geojson + gpkg):

```bash
OUTDIR=~/Downloads/my-export
BBOX="minlon=7.765700&minlat=49.315500&maxlon=10.585600&maxlat=51.646700"
BASE="https://tilda-geo.de/api/export/deutschland/bikelanes"

mkdir -p "$OUTDIR"
curl -sSL --fail-with-body --retry 3 -o "$OUTDIR/bikelanes.geojson" "${BASE}?${BBOX}&format=geojson&apiKey=${API_KEY}"
curl -sSL --fail-with-body --retry 3 -o "$OUTDIR/bikelanes.gpkg"    "${BASE}?${BBOX}&format=gpkg&apiKey=${API_KEY}"
```

Large bboxes can take 30s+. `--fail-with-body` makes HTTP errors fail loudly and leaves the JSON error in the output file — read it, then delete the file. The server's own filename (table + OSM data date) is in `Content-Disposition`.

## Errors

| Status | Meaning                                                                                |
| ------ | -------------------------------------------------------------------------------------- |
| 401    | Wrong or empty key (dev key instead of `ATLAS_API_KEY_PRODUCTION`)                     |
| 404    | Table is not enabled in the `deutschland` region's `exports` config, or unknown region |
| 400    | Unknown `format`, or only some of the four bbox params given                           |

Staging (`staging.tilda-geo.de`) works the same with `ATLAS_API_KEY_STAGING`.

## Auth note

`apiKey` bypasses session/membership checks ([`compareApiKeyTimingSafe`](../../../app/src/server/api/util/checkApiKey.server.ts)), which compares against the deployment's own `ATLAS_API_KEY`. Without it, the route requires region membership or admin.
