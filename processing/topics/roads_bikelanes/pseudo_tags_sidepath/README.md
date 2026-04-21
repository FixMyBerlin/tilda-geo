# Sidepath pseudo tags

This folder contains roads_bikelanes sidepath pseudo-tag logic:

- sidepath CSV loader and lookup helper (`_is_sidepath`)
- dedicated source table writer for sidepath estimation input
- SQL export pipeline for `is_sidepath_estimation.csv`
- sidepath export entry used by `processing/index.ts`

Mapillary pseudo-tag helpers are intentionally kept in:
`processing/topics/roads_bikelanes/pseudo_tags_mapillary_coverage/`.
