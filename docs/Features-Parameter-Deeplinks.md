# Features Parameter (`f`) - Deeplink Specification

This document explains how to construct the `f` URL parameter to create deeplinks that open the inspector for specific map features.

## Deeplink Components

A working deeplink requires three URL parameters working together:

| Parameter | Purpose |
|-----------|---------|
| `map` | Positions the viewport near the feature (`zoom/lat/lon`) |
| `config` | Ensures the referenced layers are visible |
| `f` | Selects the feature(s) to highlight and inspect |

All three must be set correctly for the deeplink to work. If the `config` doesn't have the layer visible, or the `map` viewport is too far away, the feature won't be shown.

**Example URL:**

```
https://tilda-geo.de/regionen/radinfra?map=13/52.4989/13.4329&config=1v92rco.7h39.4pt3i8&f=10|way/964321958|13.414382|52.487661|13.419178|52.488275&v=2
```

## `f` Parameter Format

```
f=feature1,feature2,feature3...
```

Each feature:

```
sourceNumericId|featureId|coord1|coord2                       # Point
sourceNumericId|featureId|coord1|coord2|coord3|coord4         # Line/Polygon
```

| Field | Type | Description |
|-------|------|-------------|
| sourceNumericId | number | Numeric ID for the data source |
| featureId | number or string | The feature's ID from the source data |
| coord1, coord2 | number | For points: `longitude\|latitude`. For other geometries: `minLon\|minLat` |
| coord3, coord4 | number | For non-point geometries only: `maxLon\|maxLat` (bounding box) |

## `sourceNumericId`

The `sourceNumericId` maps a source name to a numeric ID for compact URLs.

### For TILDA data and Mapillary

The [mapping in `url.ts`](../app/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/url.ts) provides the `sourceNumericId` for each TILDA source (e.g., `atlas_bikelanes`, `atlas_roads`). Mapillary is treated as a special case and also has an ID in this mapping.

### For static data

Deep links to static data sources are harder to create manually. The `sourceNumericId` is computed as an **Adler-32 checksum** of the dataset's `sourceId` string.

The `sourceId` is derived from the folder name via [`updateStaticDatasets.ts`](../app/scripts/StaticDatasets/updateStaticDatasets.ts) — see `uploadSlug`. See [`serializeFeaturesParam()` in `useFeaturesParam.ts`](../app/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/useFeaturesParam.ts) for the checksum fallback logic.

## `featureId`

The `featureId` is the feature's unique identifier.

### For TILDA data

TILDA sources use OSM-derived IDs:
- **String format**: `way/1010110070`, `node/12345` (OSM type/ID)
- **Numeric**: Some sources use plain numeric IDs

### For static data

The `featureId` is an **Adler-32 checksum** of the entire feature JSON (`JSON.stringify(feature)`), computed during upload.

This makes deep links to static data features impractical to create manually.

Note: In the future, we will validate that IDs are unique for a dataset and reuse those IDs. See [`addUniqueIds.ts`](../app/scripts/StaticDatasets/updateStaticDatasets/addUniqueIds.ts).

## Coordinates (`coord1`, `coord2`, `coord3`, `coord4`)

- **Points**: 2 coordinates → `longitude|latitude`
- **Lines/Polygons**: 4 coordinates → bounding box `minLon|minLat|maxLon|maxLat`
- **Precision**: 6 decimal places maximum

The coordinates are used to:
1. Check if the selected features are visible in the current map view (`allUrlFeaturesInBounds`)
2. Pan/zoom the map to show the selected features (`fitBounds`)

See [`util.ts`](../app/src/app/regionen/[regionSlug]/_components/SidebarInspector/util.ts) for these functions.

## Examples

### Point (Mapillary)

```
f=21|776457396685869|13.64569|52.378193
```

- `sourceNumericId`: 21 (`mapillary_coverage`)
- `featureId`: `776457396685869`
- `coord1|coord2`: Point at lon=13.64569, lat=52.378193

### Line (Bikelanes)

```
f=10|way/1010110070|13.645427|52.37763|13.646221|52.378219
```

- `sourceNumericId`: 10 (`atlas_bikelanes`)
- `featureId`: `way/1010110070`
- `coord1|coord2|coord3|coord4`: Bounding box

### Polygon (Parking Areas)

```
f=5|9718|9.118744|48.948085|9.119004|48.948291
```

- `sourceNumericId`: 5 (`lars_parking_areas`)
- `featureId`: `9718`
- `coord1|coord2|coord3|coord4`: Bounding box

### Multiple Features

```
f=10|way/12345|13.4|52.5|13.5|52.6,21|776457396685869|13.64569|52.378193
```

Comma-separated list of features.
