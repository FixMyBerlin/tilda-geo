# MapLibre: `line-width` und `line-offset` — Einheiten und Umrechnung zu Metern

Research-Dokument für die Kartendarstellung in TILDA Geo. Ziel: verstehen, in welcher Einheit Offset- und Breitenwerte in der MapLibre Style Specification stehen, und wie man sie auf reale Straßenbreiten in Metern (z. B. `road_width`) beziehen kann.

## Kurzfassung

| Eigenschaft                                                                              | Einheit laut Spec                 | Bezug zur Realwelt                                           |
| ---------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| [`line-width`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-width)   | **Pixel** (Bildschirm-/CSS-Pixel) | Kein fester Meterwert — hängt von Zoom und Breitengrad ab    |
| [`line-offset`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-offset) | **Pixel**                         | Positiv = rechts relativ zur Linienrichtung, negativ = links |

Die Style Spec kennt **keine Metereinheit**. Um eine Straßenbreite in Metern darzustellen, muss man entweder:

1. die Geometrie vor dem Rendern in Metern verschieben/verbreitern (PostGIS, wie bei Bikespuren), oder
2. in Style-Expressions Pixelwerte aus Metern berechnen (zoom- und breitengradabhängig).

---

## Offizielle Definition (MapLibre Style Spec)

Quelle: [MapLibre Style Spec — Layers (line)](https://maplibre.org/maplibre-style-spec/layers/), maschinenlesbar in [`v8.json`](https://github.com/maplibre/maplibre-style-spec/blob/main/src/reference/v8.json).

### `line-width`

- **Einheit:** `pixels`
- **Bedeutung:** Strichdicke der Linie
- **Default:** `1`
- Unterstützt data-driven Expressions (`["get", "…"]`), `interpolate` über `zoom`, `feature-state`

### `line-offset`

- **Einheit:** `pixels`
- **Bedeutung:** Versatz senkrecht zur Linie
  - Linien-Features: positiv = rechts relativ zur Linienrichtung, negativ = links
  - Polygon-Features: positiv = Inset, negativ = Outset
- **Default:** `0`

### Verwandte Eigenschaften

- [`line-gap-width`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-gap-width): ebenfalls Pixel — definiert eine „Lücke“ in der Mitte; nützlich für Straßen mit Fahrbahn + Randstreifen
- [`line-dasharray`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-dasharray): dimensionslos, aber Längen werden mit `line-width` multipliziert (also effektiv auch pixelbasiert)

---

## Wie MapLibre die Werte intern verarbeitet

Die Style-Werte sind **Pixel**, werden im Renderer aber in **Tile-Einheiten** umgerechnet:

- [`pixels_to_tile_units.ts`](https://github.com/maplibre/maplibre-gl-js/blob/main/src/source/pixels_to_tile_units.ts) — Shader arbeiten in Tile-Koordinaten; Paint-Properties werden mit `pixelsToTileUnits()` skaliert
- [`line_program.ts`](https://github.com/maplibre/maplibre-gl-js/blob/main/src/render/program/line_program.ts) — Uniforms `u_ratio`, `u_device_pixel_ratio`, `u_units_to_pixels` für die Linien-Geometrie
- [`mercator_coordinate.ts`](https://github.com/maplibre/maplibre-gl-js/blob/main/src/geo/mercator_coordinate.ts) — `meterInMercatorCoordinateUnits()` liefert die Mercator-Skalierung pro Meter an einem Breitengrad

**Wichtig:** `device_pixel_ratio` (Retina) beeinflusst die Renderqualität, aber die Style-Spec-Werte sind **logische/CSS-Pixel**, nicht physische Gerätepixel.

---

## Umrechnung: Pixel ↔ Meter

### Grundformel (Web Mercator, 512×512-Tiles)

MapLibre/Mapbox GL nutzen 512-Pixel-Tiles (nicht 256 wie viele klassische Slippy Maps). Die Meter-pro-Pixel an einem Breitengrad `φ` und Zoom `z`:

```
metersPerPixel(z, φ) = (40075016.686 × cos(φ × π/180)) / (512 × 2^z)
```

Vereinfacht mit dem Mapbox-Referenzwert am Äquator (Zoom 0):

```
metersPerPixel(z, φ) = 78271.484 × cos(φ) / 2^z
```

Umgekehrt:

```
pixels = meters / metersPerPixel(z, φ)
```

### Haben wir `φ` (Breitengrad)?

**In MapLibre Style Expressions: nein, nicht automatisch.** Expressions kennen [`zoom`](https://maplibre.org/maplibre-style-spec/expressions/#zoom), Feature-Properties (`["get", "…"]`) und wenige Geometrie-Helfer — aber **keinen Kartenmittelpunkt** und kein `latitude` aus der Viewport-Position.

| Wo                      | `φ` verfügbar?                               | Typisch in TILDA Geo               |
| ----------------------- | -------------------------------------------- | ---------------------------------- |
| Style JSON (statisch)   | Nur als **Konstante** oder Feature-Property  | `51` fest verdrahten (Deutschland) |
| Style JSON (dynamisch)  | TS baut Expression aus `map.getCenter().lat` | möglich, aber unüblich             |
| Feature-Property        | `["get", "lat"]` wenn Processing es schreibt | heute **nicht** vorhanden          |
| TypeScript zur Laufzeit | `map.getCenter().lat`                        | ja, z. B. für Legenden/Tests       |

**Praxis für Deutschland:** `φ ≈ 51°` als Konstante reicht meist (Fehler Köln↔München ~2 %). Genauer: Centroid-Lat pro Feature im Processing ergänzen.

### TypeScript

```typescript
const EARTH_CIRCUMFERENCE = 40075016.686
const TILE_SIZE = 512

const metersPerPixel = (zoom: number, latitudeDeg: number) =>
  (EARTH_CIRCUMFERENCE * Math.cos((latitudeDeg * Math.PI) / 180)) / (TILE_SIZE * 2 ** zoom)

const pixelsFromMeters = (meters: number, zoom: number, latitudeDeg: number) =>
  meters / metersPerPixel(zoom, latitudeDeg)
```

`latitudeDeg` kommt aus der Karte oder einer Konstante:

```typescript
const lat = map.getCenter().lat // Viewport-Mitte
// const lat = 51                      // Deutschland-Fallback
const px = pixelsFromMeters(6, map.getZoom(), lat) // 6 m Straße → Pixel
```

Für Style-Generierung (Konstante für Deutschland):

```typescript
const GERMANY_LAT = 51
const pixelScaleFactorAtLat = (latitudeDeg: number) =>
  (EARTH_CIRCUMFERENCE * Math.cos((latitudeDeg * Math.PI) / 180)) / TILE_SIZE
// ≈ 49233 bei 51°N — Nenner in der Expression unten

const lineWidthFromMeters = (property = 'road_width') =>
  ['*', ['get', property], ['/', ['^', 2, ['zoom']], pixelScaleFactorAtLat(GERMANY_LAT)]] as const

const lineOffsetFromMeters = (property = 'road_width', fraction = 0.5) =>
  [
    '*',
    ['*', ['get', property], fraction],
    ['/', ['^', 2, ['zoom']], pixelScaleFactorAtLat(GERMANY_LAT)],
  ] as const
```

MapLibre-API-Alternative (nur TS, nicht in Expressions): [`MercatorCoordinate.fromLngLat(center).meterInMercatorCoordinateUnits()`](https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/#meterinmercatorcoordinateunits) — liefert Mercator-Einheiten pro Meter, nicht direkt Pixel; für Paint-Properties braucht man die Formel oben.

### MapLibre Style Expression (ohne `φ` — Deutschland-Konstante)

Wenn `road_width` in Metern als Feature-Property existiert, reicht **eine Expression ohne `interpolate`-Stops**:

```json
"line-width": [
  "*",
  ["get", "road_width"],
  ["/", ["^", 2, ["zoom"]], 49233]
]
```

Halbe Straßenbreite als Offset:

```json
"line-offset": [
  "*",
  ["/", ["get", "road_width"], 2],
  ["/", ["^", 2, ["zoom"]], 49233]
]
```

`49233` = `(40075016.686 / 512) × cos(51°)` — für ganz Deutschland fest verdrahtet, kein `φ` in der Expression nötig.

**Warum `["^", 2, ["zoom"]]`?** Weil sich Meter-pro-Pixel mit jedem Zoom halbiert, muss Pixel = Meter × 2^z / Faktor sein. Das ersetzt eine lange `interpolate`-Tabelle.

Mit Feature-`lat` (falls Processing `ST_Y(ST_Centroid(geom))` o. ä. schreibt):

```json
"line-width": [
  "*",
  ["get", "road_width"],
  [
    "/",
    ["^", 2, ["zoom"]],
    [
      "*",
      78271.484,
      ["cos", ["*", 0.017453292519943295, ["get", "lat"]]]
    ]
  ]
]
```

`0.017453292519943295` = π/180 (Expressions haben kein `pi`).

### Deutschland (~51° N)

Für den Mittelpunkt Deutschlands (`φ ≈ 51°`, `cos(51°) ≈ 0.629`):

```
metersPerPixel(z) ≈ 49233 / 2^z
```

| Zoom | m/Pixel (51° N) | Pixel für 6 m Breite | Pixel für 3 m Offset (halbe Breite) |
| ---- | --------------- | -------------------- | ----------------------------------- |
| 10   | ~48,1           | ~0,12                | ~0,06                               |
| 12   | ~12,0           | ~0,5                 | ~0,25                               |
| 14   | ~3,0            | ~2,0                 | ~1,0                                |
| 16   | ~0,75           | ~8,0                 | ~4,0                                |
| 18   | ~0,19           | ~32                  | ~16                                 |

Referenztabelle mit mehr Breitengraden: [Mapbox Help — Zoom levels and geographical distance](https://docs.mapbox.com/help/glossary/zoom-level/) (512-Pixel-Tiles, MapLibre-kompatibel).

### Konstante Meterbreite über alle Zoomstufen

Damit eine Linie auf der Karte **immer dieselbe reale Breite** hat, muss die Pixelbreite mit `2^zoom` wachsen (exponentielle Interpolation, Basis 2):

```json
"line-width": [
  "interpolate", ["exponential", 2], ["zoom"],
  10, ["*", ["get", "road_width_m"], 0.00207],
  22, ["*", ["get", "road_width_m"], 8.53]
]
```

Die Faktoren hängen vom Referenz-Breitengrad ab. Allgemeiner Ansatz (aus [mapbox-gl-js#5861](https://github.com/mapbox/mapbox-gl-js/issues/5861)):

```json
"line-width": [
  "interpolate", ["exponential", 2], ["zoom"],
  10, ["*", ["get", "width_m"], ["^", 2, 10 - 16]]],
  24, ["*", ["get", "width_m"], ["^", 2, 24 - 16]]]
]
```

…wobei der Exponent `16 - zoom` bzw. `zoom - baseZoom` den px/m-Faktor anpasst. Für präzise Ergebnisse sollte der Breitengrad pro Feature einfließen:

```json
["/", meters, ["*", metersPerPixelAtBaseZoom, ["cos", ["*", ["pi"], ["/", ["get", "lat"], 180]]]]]]
```

(`pi` ist in MapLibre-Expressions nicht direkt verfügbar — in der Praxis fest verdrahten oder serverseitig vorberechnen.)

### `line-offset` in Metern

Gleiche Logik wie `line-width`. Beispiel: Radspur rechts neben Straßenmitte bei halber Straßenbreite:

```json
"line-offset": [
  "interpolate", ["exponential", 2], ["zoom"],
  14, ["/", ["get", "road_width"], 2],   // ← falsch: das wären Meter als Pixel!
  16, ["get", "road_width"]
]
```

Korrekt wäre z. B.:

```json
"line-offset": [
  "interpolate", ["exponential", 2], ["zoom"],
  14, ["*", ["/", ["get", "road_width"], 2], 0.33],
  16, ["*", ["/", ["get", "road_width"], 2], 1.33]
]
```

…mit Faktoren `1 / metersPerPixel(z, φ)` für den jeweiligen Zoom.

---

## Aktueller Stand in TILDA Geo

### Styles: zoom-interpolierte Pixelwerte (nicht metergenau)

Die MapLibre-Styles kommen aus Mapbox Studio und werden per `bun run mapbox-styles-update` generiert — siehe [`app/scripts/MapboxStyles/README.md`](../app/scripts/MapboxStyles/README.md).

Typisches Muster in den generierten Layer-Dateien:

```typescript
// app/src/components/regionen/.../mapboxStyles/groups/atlas_bikelane_presence.ts
'line-offset': ['step', ['zoom'], 1, 14, 4, 16, 8],
'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 4],
```

Das sind **handkalibrierte Pixelstops**, die grob mit Zoom skalieren, aber **nicht** an `road_width` oder andere Meter-Attribute gebunden sind. Die Werte bei Zoom 16 (Offset ±8 px ≈ 6 m bei 51° N) passen ungefähr zu einer typischen Wohnstraßenbreite — sind aber nicht datengetrieben.

Das `width`-Attribut in Styles wie [`radinfra_width.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/radinfra_width.ts) steuert nur die **Farbe** (Interpolation über `["get", "width"]` in Metern), nicht die Linienbreite auf der Karte.

### Processing: Meter in der Geometrie (datengetrieben)

Für Bikespuren verschiebt das Processing die Geometrie in **echten Metern**, nicht über MapLibre-Offset:

1. **Offset-Berechnung (Lua):** [`processing/topics/roads_bikelanes/bikelanes/extract_bikelanes.lua`](../processing/topics/roads_bikelanes/bikelanes/extract_bikelanes.lua)

   ```lua
   result_tags.offset = side_sign_map[transformed_tags._side] * road_width(object_tags) / 2
   ```

   `road_width` kommt aus [`processing/topics/helper/road_width.lua`](../processing/topics/helper/road_width.lua) (OSM-`width`-Tag oder Highway-Fallback in Metern).

2. **Geometrie-Verschiebung (SQL):** [`processing/topics/roads_bikelanes/2_move_bikelanes.sql`](../processing/topics/roads_bikelanes/2_move_bikelanes.sql)

   ```sql
   ST_OffsetCurve(..., (tags ->> 'offset')::numeric)  -- Meter in EPSG:5243
   ```

3. **Parken:** [`processing/topics/parking/roads/helper/road_width_tags.lua`](../processing/topics/parking/roads/helper/road_width_tags.lua) — `road_width` in Metern mit Confidence/Source; wird als Attribut exportiert, nicht für MapLibre-Offset genutzt.

**Fazit:** TILDA Geo nutzt heute zwei getrennte Welten:

| Ansatz                                | Wo                  | Einheit | Datengetrieben    |
| ------------------------------------- | ------------------- | ------- | ----------------- |
| MapLibre `line-offset` / `line-width` | Mapbox-Styles       | Pixel   | Nein (Zoom-Stops) |
| `ST_OffsetCurve` + `offset`-Tag       | Bikespuren-Pipeline | Meter   | Ja (`road_width`) |

---

## Empfehlungen für meterbasierte Darstellung

### Option A: Geometrie im Processing anpassen (bewährt)

Wie bei Bikespuren: Offset und Breite als Meter in PostGIS anwenden, Style nur noch für Farbe/Symbolik.

- **Vorteil:** zoom-unabhängig korrekt, kein Expression-Hokuspokus
- **Nachteil:** mehr Processing, separate Geometrien pro Darstellungsebene

### Option B: Style-Expressions mit `road_width`

`line-width` und `line-offset` aus `["get", "road_width"]` ableiten, mit `interpolate`/`exponential` über `zoom` und optional Breitengrad-Korrektur.

- **Vorteil:** eine Zentroidlinie, dynamische Darstellung
- **Nachteil:** komplexe Expressions; Genauigkeit variiert mit Latitude; Performance bei vielen Layern testen

Beispiel-Skizze für halbe Straßenbreite als Offset bei 51° N:

```json
"line-offset": [
  "interpolate", ["exponential", 2], ["zoom"],
  12, ["*", ["/", ["get", "road_width"], 2], 0.083],
  14, ["*", ["/", ["get", "road_width"], 2], 0.33],
  16, ["*", ["/", ["get", "road_width"], 2], 1.33],
  18, ["*", ["/", ["get", "road_width"], 2], 5.33]
]
```

Faktoren = `1 / (49233 / 2^z)` für φ = 51°.

### Option C: Linie zu Polygon puffern

Für exakte Flächendarstellung: `turf.buffer` / `ST_Buffer` mit Breite in Metern → `fill`-Layer. Diskutiert in [GIS StackExchange](https://gis.stackexchange.com/questions/259407/style-line-width-proportionally-to-maintain-relative-size-in-mapbox-gl).

- **Vorteil:** geometrisch korrekt bei jedem Zoom
- **Nachteil:** größere Geometrien, mehr Tile-Daten

---

## Hilfsfunktion (TypeScript, zur Verifikation)

Für Tests und Style-Generierung kann man die Umrechnung so kapseln:

```typescript
const EARTH_CIRCUMFERENCE = 40075016.686
const TILE_SIZE = 512

const metersPerPixel = (zoom: number, latitudeDeg: number) =>
  (EARTH_CIRCUMFERENCE * Math.cos((latitudeDeg * Math.PI) / 180)) / (TILE_SIZE * 2 ** zoom)

const pixelsFromMeters = (meters: number, zoom: number, latitudeDeg: number) =>
  meters / metersPerPixel(zoom, latitudeDeg)
```

MapLibre-API-Äquivalent zur Laufzeit: `map.getZoom()` + `MercatorCoordinate.fromLngLat(center).meterInMercatorCoordinateUnits()` — siehe [MercatorCoordinate.meterInMercatorCoordinateUnits()](https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/#meterinmercatorcoordinateunits).

---

## Referenzen

### MapLibre / Mapbox

| Ressource                                                                                                                                                 | Inhalt                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [Style Spec — `line-width`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-width)                                                       | Offizielle Doku: Einheit Pixel              |
| [Style Spec — `line-offset`](https://maplibre.org/maplibre-style-spec/layers/#paint-line-line-offset)                                                     | Offizielle Doku: Einheit Pixel, Richtung    |
| [`v8.json` (line-width/offset)](https://github.com/maplibre/maplibre-style-spec/blob/main/src/reference/v8.json)                                          | Maschinenlesbare Spec                       |
| [`pixels_to_tile_units.ts`](https://github.com/maplibre/maplibre-gl-js/blob/main/src/source/pixels_to_tile_units.ts)                                      | Pixel → Tile-Einheiten                      |
| [`mercator_coordinate.ts`](https://github.com/maplibre/maplibre-gl-js/blob/main/src/geo/mercator_coordinate.ts)                                           | Meter in Mercator-Einheiten                 |
| [Mapbox — Zoom levels and geographical distance](https://docs.mapbox.com/help/glossary/zoom-level/)                                                       | m/Pixel-Tabelle nach Breitengrad            |
| [mapbox-gl-js#5861](https://github.com/mapbox/mapbox-gl-js/issues/5861)                                                                                   | Expressions für meterkonstante Linienbreite |
| [GIS SE — proportional line width](https://gis.stackexchange.com/questions/259407/style-line-width-proportionally-to-maintain-relative-size-in-mapbox-gl) | Zoom-Skalierung und Buffer-Alternative      |

### TILDA Geo (Repo)

| Pfad                                                                                                                                                                                  | Inhalt                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`app/scripts/MapboxStyles/README.md`](../app/scripts/MapboxStyles/README.md)                                                                                                         | Style-Workflow (Mapbox Studio → MapLibre)                                              |
| [`app/scripts/MapLibreToMasterportal/`](../app/scripts/MapLibreToMasterportal/)                                                                                                       | Konvertierung MapLibre → Masterportal (Pixelbreiten werden bei festem Zoom ausgelesen) |
| [`processing/topics/helper/road_width.lua`](../processing/topics/helper/road_width.lua)                                                                                               | Straßenbreite in Metern (Bikespuren)                                                   |
| [`processing/topics/parking/roads/helper/road_width_tags.lua`](../processing/topics/parking/roads/helper/road_width_tags.lua)                                                         | `road_width`-Attribut für Parken                                                       |
| [`processing/topics/roads_bikelanes/2_move_bikelanes.sql`](../processing/topics/roads_bikelanes/2_move_bikelanes.sql)                                                                 | Meter-Offset via `ST_OffsetCurve`                                                      |
| [`app/.../mapboxStyles/groups/atlas_bikelane_presence.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/atlas_bikelane_presence.ts) | Beispiel: pixelbasierte `line-offset`-Stops                                            |
| [`app/package.json`](../app/package.json)                                                                                                                                             | `maplibre-gl@6.0.0`, `@maplibre/maplibre-gl-style-spec@^26.2.1`                        |

---

## Offene Punkte

- **Breitengrad pro Feature:** Für Deutschland reicht oft φ ≈ 51° als Konstante; für NRW vs. Bayern kann man ~1–2 % Abweichung erwarten.
- **Mapbox Studio:** Expressions mit `road_width` lassen sich dort testen, bevor `mapbox-styles-update` läuft.
- **Masterportal-Export:** [`MapLibreToMasterportal`](../app/scripts/MapLibreToMasterportal/lib/mapboxLayerToMasterportal.ts) liest `line-width` bei einem festen Zoom aus — meterbasierte Styles müssten dort ggf. separat behandelt werden.
