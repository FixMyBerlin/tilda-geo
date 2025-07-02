# Changelog of schema changes

This is an manual and incomplete list of change to the data structure.

## 2025-07~02

### `bikelanes`

- Introduce `surface_color` as sanitized value
- Remove `osm_surface:colour`

### `roads`, `roadsPathClasses`

- Rename `road_oneway` to `oneway_road`
- Rename `road_oneway:bicycle` to `oneway_bicycle`
- Remove `highway=service + service=drive-through` from the data; we did not render this

## 2025-06

### `roads*`, `bikelanes`

- Rework `surface` sanitization
- Introduce `surface=mosaic_sett|small_sett|large_sett`

## Older changes

Older changes are not tracked here.
