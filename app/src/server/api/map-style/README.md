# About

`styles/<id>.json` are the base styles from Maptiler, one per entry in
[`BACKGROUND_STYLES`](../../../components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const.ts).
Do not edit them by hand. Each region picks one in the admin form („Kategorien → Hintergrund-Stil“, `Region.backgroundStyle`).

| Id        | Maptiler                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------- |
| `atlas`   | [atlas-basemap](https://cloud.maptiler.com/maps/08357855-50d4-44e1-ac9f-ea099d9de4a5/)             |
| `dataviz` | [Tilda Datenvisualisierung](https://cloud.maptiler.com/maps/01a1c5e0-876a-739e-a609-6781d8f2a207/) |

- Change a style in the Maptiler editor.
- Run `bun run map-style-update` to download all styles. Our layers and static datasets are placed below
  the anchor layers in `LAYER_POSITIONS`. A style that lacks one gets an empty layer of that id inserted
  below the layer named in its `anchorsBefore`. The script refuses a style whose anchors are still missing
  or out of order.
- `bun run dev` warns once per week when a style in Maptiler differs from our copy.

To add a style: add it to `BACKGROUND_STYLES` (with the vector source and the building height fields for the
3D buildings), import its JSON in `mapStyleResponse.ts`, then run `bun run map-style-update`.

The `/api/map-style/<id>` route applies runtime overrides on top of it:

- sprite URL → our sprite under `/map-style/sprite?v=<hash>` (the hash changes when the built sprite changes), see [scripts/map-style](../../../../scripts/map-style/README.md)
- `sky: {}` → enable MapLibre sky with style-spec defaults (for pitched/3D views)

The response is cached by the browser with an ETag, see `mapStyleResponse.ts`.
