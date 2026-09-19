# Vegetationsflächen (NDVI)

On-demand-Erkennung von Vegetationsflächen aus CIR-Luftbildern für das Planungsmodul.
Pro Planungslauf werden die Flächen berechnet, als eigener Karten-Layer ausgeliefert
und – sofern als Faktor gewichtet – in den Hexagon-Gesamtscore eingerechnet.

Kerncode: [`flaechenfinder/vegetation.py`](flaechenfinder/vegetation.py).

## Funktionsweise

1. **Kacheln bestimmen** – aus der Bounding-Box des Studiengebiets werden die
   überdeckenden CIR-DOP-Kacheln abgeleitet. Kachelraster, CRS und Dateiname
   kommen aus der jeweiligen Quelle (siehe unten), nicht aus `vegetation.py`.
2. **NDVI je Kachel** – `NDVI = (NIR − Rot) / (NIR + Rot)` (Band 1 = NIR, Band 2 = Rot),
   Maske `NDVI > NDVI_MIN`, morphologisches Closing, Polygonisierung, Vereinfachung,
   Entfernen kleiner Löcher/Flächen.
3. **Zusammenführen & Clippen** auf das Studiengebiet → GeoDataFrame (EPSG:25832) mit
   `geometry`, `ndvi`, `flaeche_m2`.

### Parameter (1:1 aus dem Standalone-Flächenfinder)

| Parameter             | Wert | Bedeutung                                  |
| --------------------- | ---- | ------------------------------------------ |
| `NDVI_MIN`            | 0.1  | Schwellwert Vegetation (≥ Wiese/Buschwerk) |
| `MORPH_CLOSING_ITER`  | 3    | Lücken ≤ 0,6 m schließen                   |
| `SIMPLIFY_TOLERANZ_M` | 0.5  | Geometrie-Vereinfachung                    |
| `MIN_LOCH_M2`         | 20.0 | kleinere Innenlöcher schließen             |
| `MIN_FLAECHE_M2`      | 5.0  | kleinere Polygone verwerfen                |

## Datenquellen

Kacheln werden zur Laufzeit per **WMS GetMap** bezogen; jede Quelle ist ein
`CirSource` in [`flaechenfinder/cir_sources.py`](flaechenfinder/cir_sources.py).
Überall NIR = Band 1, Rot = Band 2, Bodenauflösung 0,2 m.

| Quelle                       | `cir_source` | CRS        | Kachel | Bild         | Format |
| ---------------------------- | ------------ | ---------- | ------ | ------------ | ------ |
| Bayern DOP20 CIR             | `bayern`     | EPSG:25832 | 1000 m | 5000×5000 px | TIFF   |
| Brandenburg/Berlin DOP20 CIR | `bb`         | EPSG:25833 | 1000 m | 5000×5000 px | PNG    |
| Hessen DOP20 CIR             | `hessen`     | EPSG:25832 | 500 m  | 2500×2500 px | TIFF   |

`cir_source: "auto"` (Default) wählt anhand des Studiengebiet-Zentroiden:
Hessen-Bounding-Box → Hessen, sonst < 12° O → Bayern, ≥ 12° O → Brandenburg/Berlin.

> **Hessen: 500-m-Raster ist Pflicht.** Der MapServer hinter dem HVBG-WMS begrenzt
> `WIDTH`/`HEIGHT` hart auf **3000 px** und antwortet darüber mit einer
> ServiceException statt mit einem Bild. Ein 1000-m-Raster bei 0,2 m wären 5000 px –
> damit schlägt _jede_ Kachel fehl und die Vegetation bleibt landesweit leer.

Heruntergeladene Kacheln werden im Volume `planning_cir` (`/cir`) **gecacht** und
nicht erneut geladen. Außerhalb der abgedeckten Länder gibt es keine Kacheln →
Vegetation bleibt leer, das übrige Scoring läuft normal weiter.

Pro km² fallen ~100–200 MB an – der erste Lauf eines größeren Gebiets lädt
entsprechend viel. Ein fehlgeschlagener Lauf wird **nicht** als Cache-Treffer
wiederverwendet (siehe `_find_reusable_vegetation` in `worker.py`), sonst würde ein
einzelner WMS-Ausfall alle Folgeläufe derselben Variante leer halten.

## Scoring-Integration

- Gewicht `w_vegetation`, Richtung `vegetation_direction` und Toleranzschwelle
  `vegetation_penalty_threshold_pct` im `factorConfig` des Szenarios
  (siehe [`flaechenfinder/config.py`](flaechenfinder/config.py)).
- Vegetation ist **kein additiver Teilscore** mehr, sondern ein **stufenloser
  Abzug/Bonus** auf den Grundscore (gewichteter Durchschnitt der Kriterien):
  - **Rampe:** unter `vegetation_penalty_threshold_pct` % Bedeckung (Default 20 %)
    kein Effekt; darüber linearer Anstieg bis zum Maximum bei 100 % Bedeckung.
  - **Maximaler Effekt** in Punkten = `w_vegetation × 100` (z. B. `0.3` → bis ±30).
  - **Richtung:** `negative` (Default) → Abzug (Grünflächen schützen);
    `positive` → Bonus (Bebauung auf Grün erwünscht).
  - **Gesamtscore:** `mce_gesamtscore = clamp(base ± Effekt, 0, 100)` – fällt also
    **nie unter 0** und steigt nie über 100.
- `score_vegetation` hält den **tatsächlich angewandten Effekt in Punkten**, mit
  Vorzeichen (`−w_vegetation × 100 … +w_vegetation × 100`); kein additiver
  0–100-Teilscore, sondern ein Zu-/Abschlag wie `score_bestand`.
- **Performance:** Der Bedeckungsgrad je Hexagon (Verschneidung Hexagone × Vegetation
  via Spatial-Join) wird **nur berechnet, wenn `w_vegetation > 0`**. Bei Gewicht 0 dient
  die Vegetation nur als Anzeige-Layer; `score_vegetation` ist dann `NULL`
  (Sidebar zeigt „–").

## Speicherung & Tiles

- Tabelle `planning.scenario_vegetation` (`run_id`, `geom` MultiPolygon/3857, `ndvi`,
  `flaeche_m2`) – pro Lauf, unveränderlich. Schema: [`sql/schema.sql`](sql/schema.sql).
- Martin-Tile-Funktion `public.planning_vegetation(z,x,y,{run_id})` – siehe
  [`sql/martin_functions.sql`](sql/martin_functions.sql).
- `score_vegetation` ist zusätzlich Spalte in `planning.scenario_hexagons` und Teil der
  `planning_hexagons`-Tile (Sidebar-Inspektion).

## Frontend

- **Layer-Toggle** „Vegetationsflächen" im Planungs-Panel (transienter View-State im
  Zustand-Store `usePlanningBoundaryState.vegetationVisible`, bewusst **nicht** in der URL).
- **Faktor-Editor**: Gewicht „Vegetation" + Richtungs-Umschalter (Grün schützen / bevorzugen).
- **Sidebar-Inspektion**: `score_vegetation` als Teilscore beim Gesamtscore.

## Konfiguration (Env)

| Variable                          | Default              | Zweck                           |
| --------------------------------- | -------------------- | ------------------------------- |
| `PLANNING_CIR_DIR`                | `/cir`               | Cache-Verzeichnis der Kacheln   |
| `PLANNING_CIR_DOWNLOAD`           | `1`                  | Auto-Download (`0` = nur Cache) |
| `PLANNING_CIR_WMS_URL`            | Bayern-WMS           | WMS-Endpunkt                    |
| `PLANNING_CIR_WMS_LAYER`          | `by_dop20cir_bayern` | WMS-Layer                       |
| `PLANNING_CIR_DOWNLOAD_TIMEOUT_S` | `180`                | Timeout je Kachel               |

## Abhängigkeiten

`rasterio` (CIR-Kacheln lesen), `scipy` (Closing), `geopandas`/`shapely` (Geometrien).
Das Image benötigt `libexpat1` (GDAL-Laufzeit) – siehe `planning-worker.Dockerfile`.
