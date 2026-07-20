---
name: tilda-export-download
description: Download TILDA Geo dataset exports (GeoJSON, GPKG, FGB) from tilda-geo.de by bbox. Use when the user asks to export or download map data, bikelanes, roads, parkings, or other export tables for a bounding box.
---

# TILDA export download

Download clipped exports from production via `/api/export`.

## Before downloading

1. **Bbox** — ask the user for a GeoJSON-style bbox: `[minlon, minlat, maxlon, maxlat]` (WGS84).
2. **Dataset** — ask which table (e.g. `bikelanes`, `roads`, `parkings`). Allowed values: `exportApiIdentifier` in [`app/src/routes/api/export.$regionSlug.$tableName.ts`](../../../app/src/routes/api/export.$regionSlug.$tableName.ts).
3. **Format(s)** — ask which format(s). Allowed values: [`app/src/server/api/export/ogrFormats.const.ts`](../../../app/src/server/api/export/ogrFormats.const.ts) (`geojson`, `gpkg`, `fgb`).
4. **Output path** — ask where to save files (create the directory if needed).

Always use region slug **`deutschland`**.

## Download

Read `ATLAS_API_KEY` from repo root `.env` — do **not** `source .env` (some values break the shell):

```bash
ATLAS_API_KEY=$(grep '^ATLAS_API_KEY=' .env | cut -d= -f2- | tr -d '"')
```

URL pattern:

```
https://tilda-geo.de/api/export/deutschland/{table}?minlon={}&minlat={}&maxlon={}&maxlat={}&format={format}&apiKey=${ATLAS_API_KEY}
```

Example (`bikelanes`, geojson + gpkg):

```bash
OUTDIR=~/Downloads/my-export
BBOX="minlon=7.765700&minlat=49.315500&maxlon=10.585600&maxlat=51.646700"
BASE="https://tilda-geo.de/api/export/deutschland/bikelanes"

mkdir -p "$OUTDIR"
curl -fSL --retry 3 -o "$OUTDIR/bikelanes.geojson" "${BASE}?${BBOX}&format=geojson&apiKey=${ATLAS_API_KEY}"
curl -fSL --retry 3 -o "$OUTDIR/bikelanes.gpkg"    "${BASE}?${BBOX}&format=gpkg&apiKey=${ATLAS_API_KEY}"
```

Large bboxes can take 30s+. Use `curl -f` so HTTP errors fail loudly. Response filename is in `Content-Disposition` (e.g. `bikelanes_2026-07-19.geojson`).

## Auth note

`apiKey` bypasses session/membership checks ([`compareApiKeyTimingSafe`](../../../app/src/server/api/util/checkApiKey.server.ts)). Without it, the route requires region membership or admin.
