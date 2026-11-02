# ALKIS in the planning mode — current state

Short overview of which ALKIS data the Flächenfinder actually uses today.

## Conclusion

**None.** No score factor accesses ALKIS — neither vector nor raster data.
All input geometries of the scoring come from OSM (via TILDA's `public` schema),
plus DGM1 (elevation) and DOP20 CIR aerial imagery (vegetation).

## Data sources per factor

See [`SCORING.md`](SCORING.md), loaders in [`flaechenfinder/postgis_loader.py`](flaechenfinder/postgis_loader.py).

| Factor / flag                             | Source                                                                       | Origin                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| `score_radweg`                            | `public.bikelanes`                                                           | OSM                                              |
| `score_zielorte`                          | OSM tags per scenario `targets`                                              | OSM                                              |
| `score_oepnv`                             | `public.publicTransport`, `public._publicTransport_entrances`                | OSM                                              |
| `score_kreuzung`, `score_fussgaengerzone` | `public._parking_intersection_corners` (+ `_parking_kerbs`/`_parking_roads`) | OSM (parking topic)                              |
| `score_parken`                            | `public.parkings`, `public.parkings_separate`                                | OSM (parking topic)                              |
| `score_bestand`                           | `public.bicycleParking_points`                                               | OSM                                              |
| `gebaeude` (hard exclusion)               | `public._buildings`                                                          | **OSM** (landcover topic), _not_ ALKIS buildings |
| `score_hangneigung`                       | DGM1 GeoTIFF via `planning_dem` volume, otherwise SRTM fallback              | official DGM, not ALKIS                          |
| `score_vegetation`                        | DOP20 CIR (Bavaria, Brandenburg/Berlin, Hesse) → NDVI                        | official orthophotos, not ALKIS                  |
| `score_eigendaten`                        | User GeoJSON upload                                                          | user data                                        |

The building flag is the only factor that looks like ALKIS content-wise — but it comes
from OSM (`processing/topics/landcover/buildings/`, filter: < 100 m² discarded).

### Refilling `public._buildings`: how and when

`_buildings` is part of the **`landcover`** topic (not a topic of its own) and therefore only
runs in the weekly weekend run, not in the nightly pipeline (see
`processing/README.md`). To refresh locally/manually:

```sh
PROCESS_ONLY_TOPICS=landcover SKIP_DOWNLOAD=1 SKIP_WARM_CACHE=1 SKIP_UNCHANGED=0 \
PROCESSING_DIFFING_MODE=off docker compose up -d processing && docker logs -f processing
```

When needed: if `_buildings` is empty/outdated (e.g. after a DB reset — hashes live in the
`osmfiles` volume, see [SKIP_UNCHANGED trap](../processing/README.md#trap-empty-table-although-the-topic-ran))
or if the `gebaeude` exclusion flag in the scoring yields suspiciously many/few hits.
`SKIP_UNCHANGED=0` is required, otherwise the run is skipped based on the Lua/SQL hash.

## ALKIS in the repo (outside the scoring)

Only as a **raster background map** in the map UI, display only — the worker
reads nothing from it:

- Berlin ALKIS tiles (`mapproxy.codefor.de/tiles/.../alkis_30/…`) in
  [`sourcesBackgroundsRasterTILDA.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRasterTILDA.ts)
- ALKIS WMS for Brandenburg, NRW, Saxony, Saxony-Anhalt in
  [`sourcesBackgroundRasterELI.const.ts`](../app/src/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundRasterELI.const.ts)

## Planned, not implemented

Ownership factor (`score_eigentum`: public / private / railway) based on
classified ALKIS parcels, on demand via the Rust CLI
`ist-dieses-flurstueck-oeffentlich` (Baden-Württemberg only).
Plan: [`.claude/plans/in-dem-repository-ist-magical-turing.md`](../.claude/plans/in-dem-repository-ist-magical-turing.md).
Nothing of it exists in the code yet (no `scenario_parcels`, no `w_eigentum`).
