# ALKIS im Planungsmodus — Ist-Stand

Kurzübersicht, welche ALKIS-Daten der Flächenfinder heute tatsächlich nutzt.

## Fazit

**Keine.** Kein Score-Faktor greift auf ALKIS zu — weder Vektor- noch Rasterdaten.
Alle Eingangsgeometrien des Scorings stammen aus OSM (über tildas `public`-Schema),
ergänzt um DGM1 (Höhe) und DOP20-CIR-Luftbilder (Vegetation).

## Datenquellen je Faktor

Siehe [`SCORING.md`](SCORING.md), Loader in [`flaechenfinder/postgis_loader.py`](flaechenfinder/postgis_loader.py).

| Faktor / Flag | Quelle | Herkunft |
|---|---|---|
| `score_radweg` | `public.bikelanes` | OSM |
| `score_zielorte` | OSM-Tags je Szenario-`targets` | OSM |
| `score_oepnv` | `public.publicTransport`, `public._publicTransport_entrances` | OSM |
| `score_kreuzung`, `score_fussgaengerzone` | `public._parking_intersection_corners` (+ `_parking_kerbs`/`_parking_roads`) | OSM (Parking-Topic) |
| `score_parken` | `public.parkings`, `public.parkings_separate` | OSM (Parking-Topic) |
| `score_bestand` | `public.bicycleParking_points` | OSM |
| `gebaeude` (harter Ausschluss) | `public._buildings` | **OSM** (Landcover-Topic), *nicht* ALKIS-Gebäude |
| `score_hangneigung` | DGM1-GeoTIFF via `planning_dem`-Volume, sonst SRTM-Fallback | amtliches DGM, kein ALKIS |
| `score_vegetation` | DOP20-CIR (Bayern, Brandenburg/Berlin, Hessen) → NDVI | amtliche Orthophotos, kein ALKIS |
| `score_eigendaten` | GeoJSON-Upload des Nutzers | Nutzerdaten |

Das Gebäude-Flag ist der einzige Faktor, der inhaltlich nach ALKIS aussieht — er kommt
aber aus OSM (`processing/topics/landcover/buildings/`, Filter: < 100 m² verworfen).

### `public._buildings` neu befüllen: wie und wann

`_buildings` ist Teil des **`landcover`**-Topics (kein eigenes Topic) und läuft daher nur
im wöchentlichen Weekend-Run, nicht in der nightly Pipeline (siehe
`processing/README.md`). Lokal/manuell auffrischen:

```sh
PROCESS_ONLY_TOPICS=landcover SKIP_DOWNLOAD=1 SKIP_WARM_CACHE=1 SKIP_UNCHANGED=0 \
PROCESSING_DIFFING_MODE=off docker compose up -d processing && docker logs -f processing
```

Wann nötig: wenn `_buildings` leer/veraltet ist (z. B. nach DB-Reset — Hashes liegen im
`osmfiles`-Volume, siehe [SKIP_UNCHANGED-Falle](../processing/README.md#trap-empty-table-although-the-topic-ran))
oder wenn das `gebaeude`-Ausschlussflag im Scoring auffällig viele/wenige Treffer liefert.
`SKIP_UNCHANGED=0` ist Pflicht, sonst wird der Lauf anhand des Lua/SQL-Hashs übersprungen.

## ALKIS im Repo (außerhalb des Scorings)

Nur als **Raster-Hintergrundkarte** in der Karten-UI, reine Anzeige — der Worker
liest davon nichts:

- Berlin ALKIS-Tiles (`mapproxy.codefor.de/tiles/.../alkis_30/…`) in
  [`sourcesBackgroundsRasterTILDA.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRasterTILDA.ts)
- ALKIS-WMS für Brandenburg, NRW, Sachsen, Sachsen-Anhalt in
  [`sourcesBackgroundRasterELI.const.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundRasterELI.const.ts)

## Geplant, nicht umgesetzt

Eigentums-Faktor (`score_eigentum`: öffentlich / privat / Bahn) auf Basis
klassifizierter ALKIS-Flurstücke, on-demand über die Rust-CLI
`ist-dieses-flurstueck-oeffentlich` (nur Baden-Württemberg).
Plan: [`.claude/plans/in-dem-repository-ist-magical-turing.md`](../.claude/plans/in-dem-repository-ist-magical-turing.md).
Im Code existiert davon bisher nichts (keine `scenario_parcels`, kein `w_eigentum`).
