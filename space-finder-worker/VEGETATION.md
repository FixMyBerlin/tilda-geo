# Vegetation areas (NDVI)

On-demand detection of vegetation areas from CIR aerial imagery for the Flächenfinder.
Each Flächenfinder run computes the areas, serves them as a separate map layer and – if
weighted as a factor – includes them in the hexagon total score.

Core code: [`scoring/vegetation.py`](scoring/vegetation.py).

## How it works

1. **Determine tiles** – the CIR DOP tiles covering the study area's bounding box are
   derived. Tile grid, CRS and file name come from the respective source (see below),
   not from `vegetation.py`.
2. **NDVI per tile** – `NDVI = (NIR − Red) / (NIR + Red)` (band 1 = NIR, band 2 = red),
   mask `NDVI > ndvi_min` (per source, see below), morphological closing, polygonization, simplification,
   removal of small holes/areas.
3. **Merge & clip** to the study area → GeoDataFrame (EPSG:25832) with
   `geometry`, `ndvi`, `flaeche_m2`, `ndvi_min`.

### Parameters (1:1 from the standalone Flächenfinder)

| Parameter             | Value | Meaning                     |
| --------------------- | ----- | --------------------------- |
| `MORPH_CLOSING_ITER`  | 3     | Close gaps ≤ 0.6 m          |
| `SIMPLIFY_TOLERANZ_M` | 0.5   | Geometry simplification     |
| `MIN_LOCH_M2`         | 20.0  | Fill smaller interior holes |
| `MIN_FLAECHE_M2`      | 5.0   | Drop smaller polygons       |

## Data sources

Tiles are fetched at runtime via **WMS GetMap**; each source is a
`CirSource` in [`scoring/cir_sources.py`](scoring/cir_sources.py).
Everywhere NIR = band 1, red = band 2, ground resolution 0.2 m.

| Source                       | `cir_source` | CRS        | Tile   | Image        | Format | `ndvi_min` |
| ---------------------------- | ------------ | ---------- | ------ | ------------ | ------ | ---------- |
| Bayern DOP20 CIR             | `bayern`     | EPSG:25832 | 1000 m | 5000×5000 px | TIFF   | 0.1        |
| Brandenburg/Berlin DOP20 CIR | `bb`         | EPSG:25833 | 1000 m | 5000×5000 px | PNG    | 0.2        |
| Hessen DOP20 CIR             | `hessen`     | EPSG:25832 | 500 m  | 2500×2500 px | TIFF   | 0.1        |

**NDVI threshold per source.** Measured in November 2026 against OSM buildings and
green areas (one inner-city tile each):

| Tile               | Roofs: median NDVI | Roofs > 0.1 | Green: median NDVI | Green > threshold |
| ------------------ | ------------------ | ----------- | ------------------ | ----------------- |
| München (Bayern)   | −0.22              | 2 %         | 0.39               | 86 %              |
| Frankfurt (Hessen) | −0.13              | 4 %         | 0.27               | 86 %              |
| Neukölln (BB)      | +0.09              | 46 %        | 0.29               | 79 % (> 0.2)      |

The BB WMS serves display-stretched 8-bit PNGs, so roofs and asphalt sit about 0.3
higher than in the Bayern and Hessen TIFFs. With 0.1, half of Neukölln's roofs and
asphalt counted as green and the closing merged them into blocks of 80,000 m².
At 0.2 about 11 % of roofs and asphalt still pass. Re-measure when adding a source.

`cir_source: "auto"` (default) picks the source whose coverage contains the study area
centroid (rough lon/lat rectangles per state, `AUTO_COVERAGE_LONLAT` in
`cir_sources.py`; checked Hessen → Bayern → Brandenburg/Berlin, first match wins).
Outside all of them (e.g. Köln, Hamburg) there is **no** source: the run goes on without
vegetation and the progress text says "übersprungen, keine Luftbilder für dieses Gebiet".
The rectangles are approximate at the state borders; set `cir_source` explicitly there.
An explicit `cir_source` is always used, wherever the area lies.

> **Hessen: the 500 m grid is mandatory.** The MapServer behind the HVBG WMS hard-limits
> `WIDTH`/`HEIGHT` to **3000 px** and above that returns a ServiceException instead of
> an image. A 1000 m grid at 0.2 m would be 5000 px – _every_ tile would fail and
> vegetation would stay empty statewide.

Downloaded tiles are **cached** in the `space_finder_cir` volume (`/cir`) and not fetched
again. Outside the covered states there are no tiles → vegetation stays empty, the
rest of the scoring runs normally.

Each km² takes ~100–200 MB – the first run for a larger area downloads accordingly.
A failed run is **not** reused as a cache hit (see `_find_reusable_vegetation` in
`worker.py`); otherwise a single WMS outage would keep all later runs of the same
variant empty. Areas are only reused when they were computed with the same
`ndvi_min` (stored per row; legacy rows without it are recomputed).

## Scoring integration

- Weight `w_vegetation`, direction `vegetation_direction` and tolerance threshold
  `vegetation_penalty_threshold_pct` in the scenario's `factorConfig`
  (see [`scoring/config.py`](scoring/config.py)).
- Vegetation is **no longer an additive sub-score** but a **continuous
  penalty/bonus** on the base score (weighted average of the criteria):
  - **Ramp:** below `vegetation_penalty_threshold_pct` % coverage (default 20 %)
    no effect; above it a linear increase up to the maximum at 100 % coverage.
  - **Maximum effect** in points = `w_vegetation × 100` (e.g. `0.3` → up to ±30).
  - **Direction:** `negative` (default) → penalty (protect green areas);
    `positive` → bonus (building on green is desired).
  - **Total score:** `mce_gesamtscore = clamp(base ± effect, 0, 100)` – so it
    **never drops below 0** and never exceeds 100.
- `score_vegetation` holds the **actually applied effect in points**, signed
  (`−w_vegetation × 100 … +w_vegetation × 100`); not an additive 0–100 sub-score
  but a bonus/penalty like `score_bestand`.
- **Performance:** coverage per hexagon (intersection hexagons × vegetation via
  spatial join) is **only computed when `w_vegetation > 0`**. With weight 0 the
  vegetation is only a display layer; `score_vegetation` is then `NULL`
  (sidebar shows „–").

## Storage & tiles

- Table `space_finder.scenario_vegetation` (`run_id`, `geom` MultiPolygon/3857, `ndvi`,
  `flaeche_m2`, `ndvi_min`) – per run, immutable. Schema: [`sql/schema.sql`](sql/schema.sql).
- Tile function `space_finder.space_finder_vegetation(z,x,y,{run_id})` – see
  [`sql/martin_functions.sql`](sql/martin_functions.sql). Not published through Martin; the app
  serves the tiles to members only (`/api/regions/:slug/space-finder-tiles/vegetation/...`).
- `score_vegetation` is also a column in `space_finder.scenario_hexagons` and part of the
  `space_finder_hexagons` tile (sidebar inspection).

## Frontend

- **Layer toggle** "Vegetationsflächen" in the Flächenfinder panel (transient view state in
  the Zustand store `vegetationVisible` in [`space-finder-boundary-store.ts`](../app/src/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store.ts), deliberately **not** in the URL).
- **Factor editor**: weight "Vegetation" + direction toggle ("Grün schützen" / "bevorzugen").
- **Sidebar inspection**: `score_vegetation` as a Teilscore next to the total score.

## Configuration (env)

| Variable                              | Default              | Purpose                          |
| ------------------------------------- | -------------------- | -------------------------------- |
| `SPACE_FINDER_CIR_DIR`                | `/cir`               | Tile cache directory             |
| `SPACE_FINDER_CIR_DOWNLOAD`           | `1`                  | Auto-download (`0` = cache only) |
| `SPACE_FINDER_CIR_WMS_URL`            | Bayern WMS           | WMS endpoint                     |
| `SPACE_FINDER_CIR_WMS_LAYER`          | `by_dop20cir_bayern` | WMS layer                        |
| `SPACE_FINDER_CIR_DOWNLOAD_TIMEOUT_S` | `180`                | Timeout per tile                 |

## Dependencies

`rasterio` (read CIR tiles), `scipy` (closing), `geopandas`/`shapely` (geometries).
The image needs `libexpat1` (GDAL runtime) – see `space-finder-worker.Dockerfile`.
