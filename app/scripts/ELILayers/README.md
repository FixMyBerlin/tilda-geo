# ELI Layer Index Script

This script downloads and processes layer definitions from the [OSM Editor Layer Index](https://github.com/osmlab/editor-layer-index) for Germany, converting them to a format compatible with MapLibre raster sources.

## Usage

```bash
bun scripts/ELILayers/process.ts
```

## What it does

1. **Downloads ELI GeoJSON files** from [`sources/europe/de/` directory](https://github.com/osmlab/editor-layer-index/tree/gh-pages/sources/europe/de)
2. **Caches files locally** in `raw/` folder (excluded from git)
3. **Filters raster layers** - only processes imagery/raster layers (filters out vector layers)
4. **Converts tile URLs** to MapLibre-compatible format:
   - TMS: Converts `{zoom}` to `{z}` format
   - WMS: Converts `{bbox}` to `{bbox-epsg-3857}` and sets proper parameters
5. **Generates TypeScript file** at `src/app/regionen/[regionSlug]/_mapData/mapDataSources/sourcesBackgroundRasterELI.const.ts`

## Manual Selection

After running the script, manually select layers from the generated list and add them to your region configuration in `regions.const.ts`.
