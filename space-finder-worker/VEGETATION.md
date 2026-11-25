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
3. **Merge & clip** to the study area → GeoDataFrame (in the source CRS) with
   `geometry`, `ndvi`, `flaeche_m2`, `ndvi_min`, `cir_source`.

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

| Source                           | `cir_source` | CRS        | Tile   | Image        | Format | `ndvi_min` |
| -------------------------------- | ------------ | ---------- | ------ | ------------ | ------ | ---------- |
| Bayern DOP20 CIR                 | `bayern`     | EPSG:25832 | 1000 m | 5000×5000 px | TIFF   | 0.1        |
| Berlin TrueDOP20 CIR Sommer 2025 | `berlin`     | EPSG:25833 | 1000 m | 5000×5000 px | TIFF   | 0.25       |
| Brandenburg/Berlin DOP20 CIR     | `bb`         | EPSG:25833 | 1000 m | 5000×5000 px | PNG    | 0.1        |
| Hessen DOP20 CIR                 | `hessen`     | EPSG:25832 | 500 m  | 2500×2500 px | TIFF   | 0.1        |

**NDVI threshold per source.** Measured in November 2026 against OSM buildings and
green areas (Bayern/Hessen: one inner-city tile each):

| Tile               | Roofs: median NDVI | Roofs > 0.1 | Green: median NDVI | Green > threshold |
| ------------------ | ------------------ | ----------- | ------------------ | ----------------- |
| München (Bayern)   | −0.22              | 2 %         | 0.39               | 86 %              |
| Frankfurt (Hessen) | −0.13              | 4 %         | 0.27               | 86 %              |

Berlin and Brandenburg (7 Berlin tiles: Neukölln, Alexanderplatz, Tiergarten,
Siemensstadt, Marienfelde, Zehlendorf, Hellersdorf; 4 Brandenburg tiles: Potsdam,
Cottbus, Fürstenwalde, Luckenwalde). Share of pixels above the threshold, mean over
the tiles:

| Images                                 | Threshold | Roofs  | Park/lawn | Wood   |
| -------------------------------------- | --------- | ------ | --------- | ------ |
| `berlin` (summer 2025)                 | 0.2       | 7.6 %  | 89.9 %    | 97.7 % |
| `berlin` (summer 2025)                 | **0.25**  | 4.7 %  | 87.2 %    | 96.9 % |
| `berlin` (summer 2025)                 | 0.3       | 2.5 %  | 83.2 %    | 95.2 % |
| `bb` inside Berlin (spring, no leaves) | 0.2       | 17.8 % | 80.1 %    | 87.3 % |
| `bb` outside Berlin (summer)           | **0.1**   | 4.1 %  | 70.6 %    | 83.9 % |
| `bb` outside Berlin (summer)           | 0.2       | 1.5 %  | 53.9 %    | 68.0 % |

The BB WMS shows summer images outside Berlin, but a spring flight without leaves
for Berlin itself, display-stretched so that roofs and asphalt sit at NDVI ~0.1.
Berlin therefore has its own source with the summer flight of 11–12 August 2025.
Roads and squares under street trees reach the Berlin threshold more often
(15–22 %); that is canopy, not a misclassification. Green areas in Brandenburg
stay at about 70 % because of dry lawns in late summer. Re-measure when adding a
source or a newer flight. Other Berlin flights: TrueDOP 2024 (spring, NIR only as
2 km JP2 download, roofs 12 % / green 79 % at 0.2) and 2026 (no leaves) are worse.

`cir_source: "auto"` (default) picks the source whose coverage contains the study area
centroid (rough lon/lat rectangles per state and a simplified outline of Berlin,
`AUTO_COVERAGE_LONLAT` in `cir_sources.py` and `scoring/berlin_outline.py`; checked
Hessen → Bayern → Berlin → Brandenburg, first match wins).
Outside all of them (e.g. Köln, Hamburg) there is **no** source: the run goes on without
vegetation and the progress text says "übersprungen, keine Luftbilder für dieses Gebiet".
The rectangles are approximate at the state borders; set `cir_source` explicitly there.
An explicit `cir_source` is always used, wherever the area lies.

> **Berlin: images end at the city border.** The Berlin WMS paints everything outside
> Berlin white (NDVI 0), also whole tiles beyond the border. A study area centred in Berlin that
> reaches into Brandenburg gets no vegetation beyond the border; set `cir_source: "bb"`
> for such areas if that part matters.

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
variant empty. Areas are only reused when they were computed from the same source
with the same `ndvi_min` (both stored per row; legacy rows without them are
recomputed).

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
  `flaeche_m2`, `ndvi_min`, `cir_source`) – per run, immutable. Schema: [`sql/schema.sql`](sql/schema.sql).
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

| Variable                              | Default                   | Purpose                          |
| ------------------------------------- | ------------------------- | -------------------------------- |
| `SPACE_FINDER_CIR_DIR`                | `/cir`                    | Tile cache directory             |
| `SPACE_FINDER_CIR_DOWNLOAD`           | `1`                       | Auto-download (`0` = cache only) |
| `SPACE_FINDER_CIR_WMS_URL`            | Bayern WMS                | WMS endpoint                     |
| `SPACE_FINDER_CIR_WMS_LAYER`          | `by_dop20cir_bayern`      | WMS layer                        |
| `SPACE_FINDER_CIR_BE_WMS_URL`         | Berlin summer 2025        | WMS endpoint Berlin              |
| `SPACE_FINDER_CIR_BE_WMS_LAYER`       | `truedop_2025_sommer_cir` | WMS layer Berlin                 |
| `SPACE_FINDER_CIR_DOWNLOAD_TIMEOUT_S` | `180`                     | Timeout per tile                 |

## Dependencies

`rasterio` (read CIR tiles), `scipy` (closing), `geopandas`/`shapely` (geometries).
The image needs `libexpat1` (GDAL runtime) – see `space-finder-worker.Dockerfile`.
