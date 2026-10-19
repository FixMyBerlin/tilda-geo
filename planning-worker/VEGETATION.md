# Vegetation areas (NDVI)

On-demand detection of vegetation areas from CIR aerial imagery for the planning module.
Each planning run computes the areas, serves them as a separate map layer and – if
weighted as a factor – includes them in the hexagon total score.

Core code: [`flaechenfinder/vegetation.py`](flaechenfinder/vegetation.py).

## How it works

1. **Determine tiles** – the CIR DOP tiles covering the study area's bounding box are
   derived. Tile grid, CRS and file name come from the respective source (see below),
   not from `vegetation.py`.
2. **NDVI per tile** – `NDVI = (NIR − Red) / (NIR + Red)` (band 1 = NIR, band 2 = red),
   mask `NDVI > NDVI_MIN`, morphological closing, polygonization, simplification,
   removal of small holes/areas.
3. **Merge & clip** to the study area → GeoDataFrame (EPSG:25832) with
   `geometry`, `ndvi`, `flaeche_m2`.

### Parameters (1:1 from the standalone Flächenfinder)

| Parameter             | Value | Meaning                                |
| --------------------- | ----- | -------------------------------------- |
| `NDVI_MIN`            | 0.1   | Vegetation threshold (≥ meadow/shrubs) |
| `MORPH_CLOSING_ITER`  | 3     | Close gaps ≤ 0.6 m                     |
| `SIMPLIFY_TOLERANZ_M` | 0.5   | Geometry simplification                |
| `MIN_LOCH_M2`         | 20.0  | Fill smaller interior holes            |
| `MIN_FLAECHE_M2`      | 5.0   | Drop smaller polygons                  |

## Data sources

Tiles are fetched at runtime via **WMS GetMap**; each source is a
`CirSource` in [`flaechenfinder/cir_sources.py`](flaechenfinder/cir_sources.py).
Everywhere NIR = band 1, red = band 2, ground resolution 0.2 m.

| Source                       | `cir_source` | CRS        | Tile   | Image        | Format |
| ---------------------------- | ------------ | ---------- | ------ | ------------ | ------ |
| Bayern DOP20 CIR             | `bayern`     | EPSG:25832 | 1000 m | 5000×5000 px | TIFF   |
| Brandenburg/Berlin DOP20 CIR | `bb`         | EPSG:25833 | 1000 m | 5000×5000 px | PNG    |
| Hessen DOP20 CIR             | `hessen`     | EPSG:25832 | 500 m  | 2500×2500 px | TIFF   |

`cir_source: "auto"` (default) picks by the study area centroid:
Hessen bounding box → Hessen, otherwise < 12° E → Bayern, ≥ 12° E → Brandenburg/Berlin.

> **Hessen: the 500 m grid is mandatory.** The MapServer behind the HVBG WMS hard-limits
> `WIDTH`/`HEIGHT` to **3000 px** and above that returns a ServiceException instead of
> an image. A 1000 m grid at 0.2 m would be 5000 px – _every_ tile would fail and
> vegetation would stay empty statewide.

Downloaded tiles are **cached** in the `planning_cir` volume (`/cir`) and not fetched
again. Outside the covered states there are no tiles → vegetation stays empty, the
rest of the scoring runs normally.

Each km² takes ~100–200 MB – the first run for a larger area downloads accordingly.
A failed run is **not** reused as a cache hit (see `_find_reusable_vegetation` in
`worker.py`); otherwise a single WMS outage would keep all later runs of the same
variant empty.

## Scoring integration

- Weight `w_vegetation`, direction `vegetation_direction` and tolerance threshold
  `vegetation_penalty_threshold_pct` in the scenario's `factorConfig`
  (see [`flaechenfinder/config.py`](flaechenfinder/config.py)).
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

- Table `planning.scenario_vegetation` (`run_id`, `geom` MultiPolygon/3857, `ndvi`,
  `flaeche_m2`) – per run, immutable. Schema: [`sql/schema.sql`](sql/schema.sql).
- Martin tile function `public.planning_vegetation(z,x,y,{run_id})` – see
  [`sql/martin_functions.sql`](sql/martin_functions.sql).
- `score_vegetation` is also a column in `planning.scenario_hexagons` and part of the
  `planning_hexagons` tile (sidebar inspection).

## Frontend

- **Layer toggle** "Vegetationsflächen" in the planning panel (transient view state in
  the Zustand store `vegetationVisible` in [`space-finder-boundary-store.ts`](../app/src/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store.ts), deliberately **not** in the URL).
- **Factor editor**: weight "Vegetation" + direction toggle ("Grün schützen" / "bevorzugen").
- **Sidebar inspection**: `score_vegetation` as a Teilscore next to the total score.

## Configuration (env)

| Variable                          | Default              | Purpose                          |
| --------------------------------- | -------------------- | -------------------------------- |
| `PLANNING_CIR_DIR`                | `/cir`               | Tile cache directory             |
| `PLANNING_CIR_DOWNLOAD`           | `1`                  | Auto-download (`0` = cache only) |
| `PLANNING_CIR_WMS_URL`            | Bayern WMS           | WMS endpoint                     |
| `PLANNING_CIR_WMS_LAYER`          | `by_dop20cir_bayern` | WMS layer                        |
| `PLANNING_CIR_DOWNLOAD_TIMEOUT_S` | `180`                | Timeout per tile                 |

## Dependencies

`rasterio` (read CIR tiles), `scipy` (closing), `geopandas`/`shapely` (geometries).
The image needs `libexpat1` (GDAL runtime) – see `planning-worker.Dockerfile`.
