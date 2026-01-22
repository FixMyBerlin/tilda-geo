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

- `category`: StaticDatasetCategoryKey | null
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
- `--env=dev` (or staging/production, required)

**One-click command** (replace `<SUB_FOLDER_NAME>` with actual folder name):

```bash
bun --env-file=.env ./scripts/StaticDatasets/updateStaticDatasets.ts --folder-filter=<SUB_FOLDER_NAME> --env=dev
```

Note: `updateDownloadSources.ts` is for WFS downloads (requires downloadConfig.ts). Use `updateStaticDatasets.ts` for local GeoJSON files.

## Validation

Before completing:

1. ✅ Folder structure created
2. ✅ GeoJSON file moved and prettier run
3. ✅ transform.ts created only if needed
4. ✅ meta.ts follows type structure (check with TypeScript)
5. ✅ Similar datasets in group folder reviewed for patterns
6. ✅ Command verified and provided as one-click action

## References

- Types: `app/scripts/StaticDatasets/types.ts`
- Examples: `app/scripts/StaticDatasets/geojson/region-berlin/*/meta.ts`
- Utils: `app/scripts/StaticDatasets/geojson/_utils/`
- Docs: `docs/Features-Parameter-Deeplinks.md`, `docs/Regional-Masks.md`
- Update script: `app/scripts/StaticDatasets/updateStaticDatasets.ts`
