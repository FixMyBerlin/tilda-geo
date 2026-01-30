# Regional Masks System

Regional masks (also called "passepartouts") are system layers that create a visual focus on a specific region by masking out the rest of the world. They are always active on the map but hidden from the UI layer controls.

## Overview

The regional masks system integrates with the [Static Datasets system](../app/scripts/StaticDatasets/README.md) and uses the `systemLayer` flag to mark datasets as system layers.

## How Masks Are Created

Masks are created using the `npm run regions:masks` script, which:

1. Iterates through all regions defined in [`regions.const.ts`](../app/src/data/regions.const.ts)
2. For each region with `osmRelationIds`:
   - Checks if a mask folder exists at `scripts/StaticDatasets/geojson/masks/region-<SLUG>-mask`
   - If the folder doesn't exist, creates it with:
     - `meta.ts` - Configuration file (generated from shared helper)
     - `transform.ts` - Transform function (generated from shared helper)
   - Downloads the region boundary GeoJSON from the API
   - Applies the transform to create a mask (world polygon minus buffered region)
   - Saves the mask GeoJSON file
3. Calls `updateStaticDatasets.ts` with `--folder-filter=-mask` to upload masks

See [`app/scripts/Regions/createMasks.ts`](../app/scripts/Regions/createMasks.ts) for the implementation.

## Mask Creation Logic

The mask is created using [Turf.js](https://turfjs.org/):

- **OUTER**: World polygon `[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]`
- **INNER**: Region polygon (from API, buffered by configurable amount, default: 10km)
- **MASK**: `turf.difference(world, bufferedRegion)`

The transform helper is located at [`app/scripts/StaticDatasets/createMasks/transform.ts`](../app/scripts/StaticDatasets/createMasks/transform.ts).

## Configuration

### Region Configuration

Regions are configured in [`regions.const.ts`](../app/src/data/regions.const.ts) with:

- `osmRelationIds`: Array of OSM relation IDs used to fetch the boundary
- `slug`: Region identifier used for folder and file naming

### Mask Configuration

Mask-specific configuration is generated from the shared helper at [`app/scripts/StaticDatasets/createMasks/config.ts`](../app/scripts/StaticDatasets/createMasks/config.ts), which sets:

- `systemLayer: true` - Marks the dataset as a system layer
- Map styles (fill and line layers similar to MapTiler)
- Attribution and other metadata

### Buffer Configuration

The buffer distance (default: 10km) can be adjusted by editing the `transform.ts` file in each region's mask folder:

```typescript
const bufferDistanceKm = 10; // Adjust this value
```

## How Masks Are Stored

Masks are stored as static datasets following the standard structure:

- **Location**: `scripts/StaticDatasets/geojson/masks/region-<SLUG>-mask/`
- **Files**:
  - `meta.ts` - Dataset metadata and configuration
  - `transform.ts` - Transform function (references shared helper)
  - `<region-slug>-mask.geojson` - The mask GeoJSON file

See [Static Datasets README](../app/scripts/StaticDatasets/README.md) for details on the static datasets system.

## How Masks Are Served

Masks are served through the standard [Uploads API system](./Uploads.md):

- Masks are always stored as GeoJSON (not PMTiles)
- Files are accessible via `/api/uploads/region-<SLUG>-mask.geojson`

## System Layer Behavior

Datasets with `systemLayer: true` are:

- **Filtered from UI**: Not shown in `SelectDataset` component (uses `useRegionDatasets()` which queries `systemLayer: false`)
- **Always rendered**: Automatically rendered by `SourcesLayersSystemDatasets` component, separate from user-selectable datasets
- **Minimal metadata**: Can omit optional fields like `description`, `dataSourceMarkdown`, `category`, etc.

See [`app/src/app/regionen/[regionSlug]/_components/Map/SourcesAndLayers/SourcesLayersSystemDatasets.tsx`](../app/src/app/regionen/[regionSlug]/_components/Map/SourcesAndLayers/SourcesLayersSystemDatasets.tsx) for implementation details.

## Related Scripts

- `npm run regions` - Runs both `regions:masks` and `regions:configs`
- `npm run regions:masks` - Creates/updates regional masks
- `npm run regions:configs` - Updates category configs
