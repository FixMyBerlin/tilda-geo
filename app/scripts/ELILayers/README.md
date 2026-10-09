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

The ids are stored in the region configs and must not change.

- `legacyIds.json`: ELI id → the id TILDA used before this script was built on the package
  (then derived from the file name in the index). Do not edit.
- `legacyLayers.json`: layers that have left the index but may still be selected in a region.
- New layers are named `ELI_<eli id in lower case>`.

## Manual Selection

After running the script, select layers from the generated list and add them to the region
configuration via `/admin/regions`.
