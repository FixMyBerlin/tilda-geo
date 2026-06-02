# Sidepath pseudo tags

This folder contains roads_bikelanes sidepath pseudo-tag logic:

- sidepath CSV loader and lookup helper (`_is_sidepath`)
- dedicated source table writer for sidepath estimation input
- SQL export pipeline for `is_sidepath_estimation.csv`
- sidepath export entry used by `processing/index.ts`

### Skip unchanged export

Before `roads_bikelanes` runs, `exportSidepathData` builds `is_sidepath_estimation.csv` from the current DB. With `SKIP_UNCHANGED=1`, export is skipped when `roads_bikelanes` would be skipped (same conditions as topics). When the topic runs but only bikelanes Lua changed (not this folder) and the OSM file is unchanged, the existing CSV is reused.

Mapillary pseudo-tag helpers are intentionally kept in:
`processing/topics/roads_bikelanes/pseudo_tags_mapillary_coverage/`.
