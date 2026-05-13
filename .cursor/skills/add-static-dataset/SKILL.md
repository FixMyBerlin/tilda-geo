---
name: add-static-dataset
description: Add a new static dataset to app/scripts/StaticDatasets/geojson. Infers config from prompt, asks for missing data, uses types to guide required fields.
---

# Add Static Dataset

Adds a new static dataset folder to `app/scripts/StaticDatasets/geojson`. The `/geojson` folder is a symlink.

## When to Use

- User wants to add a new GeoJSON dataset
- User mentions adding static data, geojson files, "uploads", or datasets
- User provides a geojson file path and wants it integrated

## Required Information

Extract from user prompt or ask if missing:

1. **Group folder** (e.g., `region-berlin`, `region-bb`) - parent folder name
2. **Sub-folder name** (e.g., `berlin-bezirke`) - dataset folder name (must be valid slug). **Must include region/group prefix**: for `region-berlin` use `berlin-<name>`, not just `<name>`
3. **GeoJSON file path** - absolute path to source file on disk
4. **Regions** - array of region slugs (e.g., `['infravelo']`, `['berlin']`)
5. **Optional**: transformation needs, style preferences, category, attribution, license

## Process

### 1. Create Folder Structure

```bash
app/scripts/StaticDatasets/geojson/<GROUP_FOLDER>/<SUB_FOLDER>/
```

**Important**: `/geojson` is a symlink. Create folders in `app/scripts/StaticDatasets/geojson/` path.

Create directory if group folder doesn't exist. Ensure sub-folder name follows naming convention (see Required Information above).

### 2. Move GeoJSON File

- Move source file to `<SUB_FOLDER>/<FILENAME>.geojson`
- Run prettier from `app/` directory (prettier config is in app/): `cd app && bunx prettier --write scripts/StaticDatasets/geojson/<GROUP_FOLDER>/<SUB_FOLDER>/<FILENAME>.geojson`
- **Size check (dataset validation / creation)**: Measure the **uncompressed** `.geojson` file size. If it is **greater than 6 MiB** (6 × 1024² bytes), compress it so the folder ships only the archive (same pattern as other large static datasets):
  - From the dataset folder (or with absolute paths): `gzip -9 -f <FILENAME>.geojson`
  - `gzip` replaces the file with `<FILENAME>.geojson.gz` and removes the plain `.geojson`. `-9` is maximum compression; `-f` forces overwrite if a `.gz` already exists.
  - If size is **≤ 6 MiB**, leave the `.geojson` as-is (no gzip required).
- `findGeojson` in `updateStaticDatasets` accepts either a single `.geojson` or a single `.geojson.gz` per folder—never leave both.

### 3. Create transform.ts (if needed)

Only if transformation required. Use helpers from `app/scripts/StaticDatasets/geojson/_utils`:

- `transformUtils.ts` - property transformations
- `defaultLayerStyles.ts` - default styling helpers
- `translateUtils.ts` - translation helpers

Example:

```typescript
import { FeatureCollection } from "geojson";

export const transform = (data: FeatureCollection) => {
  // Use helper functions from _utils when possible
  return data;
};
```

### 4. Create meta.ts

**Critical**: Research similar datasets in same group folder first.

**Before writing meta.ts**:

1. List all datasets in `<GROUP_FOLDER>/` directory
2. Read 2-3 similar `meta.ts` files (similar geometry type, similar purpose)
3. Infer patterns:
   - Category from similar datasets
   - Attribution patterns
   - License conventions
   - Style patterns
   - Inspector settings
4. If unclear, ask user to confirm or provide missing data

**Required fields** (from `app/scripts/StaticDatasets/types.ts`):

- `regions`: RegionSlug[] (required)
- `public`: boolean (required)
- `dataSourceType`: 'local' (required)
- `configs`: Array with at least one config (required)

**Config required fields**:

- `name`: string
- `attributionHtml`: string
- `inspector`: { enabled: boolean, ... } or { enabled: false }
- `layers`: Layer[] (required)

**Config optional fields**:

- `category`: string | null — grouping key; titles/order are managed in Admin → Statische Datensatz-Kategorien (DB).
- `updatedAt`: string
- `description`: string
- `dataSourceMarkdown`: string
- `licence`: License type (see types.ts)
- `licenceOsmCompatible`: 'licence' | 'waiver' | 'no'
- `legends`: Legend[]

**Style/Legend**: If not specified, make best guess:

- Use `defaultLayerStyles()` from `_utils/defaultLayerStyles.ts` for simple cases
- For polygons: fill + outline
- For lines: colored line with width
- For points: circle markers
- Create appropriate legend entries

**Stripe / Schraffur (`fill-pattern`)**: For diagonal stripes over polygons, reuse the **existing map sprite** image id **`stripe_texture`** (same hatch as private Parkflächen in generated `parking_areas`; listed in `app/public/map-style/sprite.json`). Do not add a new sprite. Stack a **second** `fill` layer **above** the solid fill: `fill-color` `'rgba(0, 0, 0, 0)'`, `fill-opacity` around `0.5` (tune as needed), `fill-pattern` `'stripe_texture'`. Skip `fill-outline-color` on the stripe layer if the base fill already defines an outline. Use a `filter` on the stripe layer when only some features should be hatched; if exports mix boolean `true` and string `'true'`, either use an `any` / `match` filter in `meta.ts` or normalize values in `transform.ts` (step 3) so the filter stays simple.

**Example structure**:

```typescript
import { MetaData } from "../../../types";
import { defaultLayerStyles } from "../../_utils/defaultLayerStyles";

export const data: MetaData = {
  regions: ["infravelo"], // From user or infer from group folder
  public: true,
  dataSourceType: "local",
  configs: [
    {
      name: "Dataset Name",
      category: "berlin/misc", // Infer from similar datasets
      attributionHtml: "Source Name", // Ask if unclear
      licence: "DL-DE/ZERO-2.0", // Infer from similar datasets
      inspector: { enabled: false }, // Default unless specified
      layers: defaultLayerStyles(), // Or custom layers
    },
  ],
};
```

### 5. Verify Command

Check `app/scripts/StaticDatasets/updateStaticDatasets.ts` for correct params:

- `--folder-filter=<SUB_FOLDER_NAME>` (matches full path, so sub-folder name works)
- `--env=dev` (or staging/production; omit to be prompted)

**One-click command** from `app/` (replace `<SUB_FOLDER_NAME>` with actual folder name; `static-datasets-update` uses the **repository root** `.env` via `bun --env-file=../.env`, same as `bun run dev`):

```bash
bun run static-datasets-update -- --folder-filter=<SUB_FOLDER_NAME> --env=dev
```

Note: `updateDownloadSources.ts` is for WFS downloads (requires downloadConfig.ts). Use `updateStaticDatasets.ts` for local GeoJSON files.

### 6. Verify TypeScript Compilation

**Always run this after creating or modifying TypeScript files** (meta.ts, transform.ts, or any imports):

```bash
bun run type-check-deploy
```

This temporarily removes the `geojson` symlink, runs TypeScript type-checking, and restores the symlink. It simulates the Docker build environment where symlinks aren't available, ensuring your code will compile correctly during builds.

## Validation

Before completing:

1. ✅ Folder structure created
2. ✅ GeoJSON file moved; **if uncompressed `.geojson` > 6 MiB then `gzip -9 -f`** (otherwise plain `.geojson` only; never both); `meta.ts` / `transform.ts` formatted with `bun run format`
3. ✅ transform.ts created only if needed
4. ✅ meta.ts follows type structure (check with TypeScript)
5. ✅ Similar datasets in group folder reviewed for patterns
6. ✅ Command verified and provided as one-click action
7. ✅ `bun run type-check-deploy` run successfully (see Step 6)

## References

- Types: `app/scripts/StaticDatasets/types.ts`
- Examples: `app/scripts/StaticDatasets/geojson/region-berlin/*/meta.ts`
- Utils: `app/scripts/StaticDatasets/geojson/_utils/`
- Docs: `docs/Features-Parameter-Deeplinks.md`, `docs/Regional-Masks.md`
- Update script: `app/scripts/StaticDatasets/updateStaticDatasets.ts`
