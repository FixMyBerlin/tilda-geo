# ELI Layer Index Script

Builds the list of background layers for Germany from the
[OSM Editor Layer Index](https://github.com/osmlab/editor-layer-index), as packaged by
[`@osm-editor-kit/maplibre-editor-layer-index`](https://www.npmjs.com/package/@osm-editor-kit/maplibre-editor-layer-index)
(a dev dependency; the app itself does not load the package).

## Usage

```bash
bun scripts/ELILayers/process.ts
```

To get newer data, update the package first. It is rebuilt from the index every week.

## What it does

1. Takes every layer of the package whose coverage touches Germany.
2. Converts each to a MapLibre raster source with the package's own helper (tile URL, tile size,
   zoom range, TMS scheme).
3. Keeps the metadata the app uses to pick an aerial image by itself (Messen mode):
   `category` (`photo` is an aerial image), `best` (recommended for its area), `endDate` and the
   coverage `bbox`.
4. Writes `src/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundRasterELI.const.ts`.

## Stable ids

The ids are stored in the region configs, so the id of a layer that a region uses must not change.

- Layers are named `ELI_<eli id in lower case>`.
- `legacyIds.json` maps an ELI id to the older id that regions selected it under (then derived
  from the file name in the index). It only lists layers that a region in production uses; add
  nothing new here.
- A layer that leaves the index disappears from the list. A region that still selects it shows
  its other backgrounds, and has to drop the id the next time it is saved.

## Manual Selection

After running the script, select layers from the generated list and add them to the region
configuration via `/admin/regions`.
